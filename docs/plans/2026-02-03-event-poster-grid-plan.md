# Event Poster Grid Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the events page from stacked horizontal cards to a 3-column poster grid with "expand below row" detail panels.

**Architecture:** The events page grid and expansion logic live entirely in `pages/events.vue`. `EventCard.vue` becomes a simple poster thumbnail (no expansion logic). A new `poster` field is added to the Sanity event schema. Home page `EventsTeaser.vue` is untouched.

**Tech Stack:** Vue 3 / Nuxt 3, GSAP (height animations + scrollTo), Tailwind CSS, Sanity CMS

---

### Task 1: Add `poster` field to Sanity event schema

**Files:**
- Modify: `/Users/sam/Desktop/SKY-sanity-studio/schemaTypes/event.ts:20-21` (insert after `featuredImage` field)

**Step 1: Add the poster field definition**

Insert after the `featuredImage` field (after line 20):

```typescript
    defineField({
      name: 'poster',
      title: 'Poster Image',
      type: 'string',
      description: 'Vertical poster image (1349x1685) for the events page grid',
      components: { input: R2ImageInput },
    }),
```

**Step 2: Verify the schema file looks correct**

The `fields` array should now have `featuredImage` followed by `poster`, then `gallery`.

**Step 3: Commit**

```bash
git add schemaTypes/event.ts
git commit -m "feat: add poster field to event schema"
```

---

### Task 2: Update GROQ query in events page

**Files:**
- Modify: `/Users/sam/Desktop/SKY/pages/events.vue:11-13`

**Step 1: Add `poster` to the GROQ field selection**

Change line 11-13 from:

```typescript
const query = groq`*[_type == "event"] | order(date desc) {
  _id, title, date, venue, location, description, featuredImage, gallery, videoUrl, lineup
}`
```

To:

```typescript
const query = groq`*[_type == "event"] | order(date desc) {
  _id, title, date, venue, location, description, featuredImage, poster, gallery, videoUrl, lineup
}`
```

**Step 2: Commit**

```bash
git add pages/events.vue
git commit -m "feat: add poster to events GROQ query"
```

---

### Task 3: Rewrite EventCard.vue as poster thumbnail

**Files:**
- Modify: `/Users/sam/Desktop/SKY/components/EventCard.vue` (full rewrite)

**Step 1: Replace the entire file**

The new `EventCard` is a simple poster card — no expansion logic. It receives an event, shows the poster image, and shows title+date on hover only. It emits `toggle` when clicked.

```vue
<script setup lang="ts">
import type { SanityDocument } from '@sanity/client'

defineProps<{ event: SanityDocument }>()
const emit = defineEmits<{ toggle: [id: string] }>()
const { imageUrl } = useR2Image()
</script>

<template>
  <button
    class="group relative w-full overflow-hidden rounded-lg border border-white/5 hover:border-accent/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(0,229,255,0.08)] cursor-pointer"
    @click="emit('toggle', event._id)"
  >
    <div class="relative aspect-[1349/1685] overflow-hidden">
      <img
        v-if="event.poster || event.featuredImage"
        :src="imageUrl(event.poster || event.featuredImage)"
        :alt="event.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div class="absolute inset-0 bg-dark/40" />
      <!-- Hover overlay: gradient + text -->
      <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div class="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <h3 class="font-display text-xl md:text-2xl tracking-wider leading-tight">{{ event.title }}</h3>
        <p class="text-white/60 text-sm mt-1">
          {{ new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}
        </p>
      </div>
    </div>
  </button>
</template>
```

Key changes from old `EventCard`:
- No `expanded` prop, no `contentRef`, no GSAP watch, no expanded content section
- Uses `event.poster` with fallback to `event.featuredImage`
- Portrait aspect ratio `1349/1685` instead of landscape `1708/750`
- Title/date hidden by default, shown on hover via `opacity-0 group-hover:opacity-100`
- Always-visible subtle dark overlay (`bg-dark/40`) so posters look cohesive even without hover
- Emits `toggle` with event `_id` (same interface, parent handles expansion)

**Step 2: Verify no other component imports `expanded` prop from EventCard**

`EventsTeaser.vue` does NOT use `EventCard` — it renders its own cards inline. So no other file passes `expanded` to `EventCard`. Only `events.vue` does, and we'll update that next.

**Step 3: Commit**

```bash
git add components/EventCard.vue
git commit -m "feat: rewrite EventCard as poster thumbnail with hover overlay"
```

---

### Task 4: Rewrite events.vue with grid layout and expand-below-row

**Files:**
- Modify: `/Users/sam/Desktop/SKY/pages/events.vue` (full rewrite of template + script additions)

**Step 1: Replace the entire file**

```vue
<script setup lang="ts">
import { gsap } from 'gsap'

useSeoMeta({
  title: 'Events | SKY Events Asia',
  ogTitle: 'Events | SKY Events Asia',
  description: 'Upcoming and past electronic music events by SKY Events Asia.',
  ogDescription: 'Upcoming and past electronic music events by SKY Events Asia.',
})

const query = groq`*[_type == "event"] | order(date desc) {
  _id, title, date, venue, location, description, featuredImage, poster, gallery, videoUrl, lineup
}`
const { data: events } = await useSanityQuery(query)
const { imageUrl } = useR2Image()

const route = useRoute()

const initialTab = route.query.tab === 'recent' ? 'recent' : 'upcoming'
const initialEvent = typeof route.query.event === 'string' ? route.query.event : null

const activeTab = ref<'upcoming' | 'recent'>(initialTab)
const expandedId = ref<string | null>(null)

const now = new Date().toISOString()
const upcomingEvents = computed(() => events.value?.filter((e: any) => e.date > now) || [])
const pastEvents = computed(() => events.value?.filter((e: any) => e.date <= now) || [])
const displayedEvents = computed(() => activeTab.value === 'upcoming' ? upcomingEvents.value : pastEvents.value)

// Group events into rows of 3 for expand-below-row logic
const eventRows = computed(() => {
  const rows: any[][] = []
  const evts = displayedEvents.value
  for (let i = 0; i < evts.length; i += 3) {
    rows.push(evts.slice(i, i + 3))
  }
  return rows
})

// Find the expanded event object
const expandedEvent = computed(() => {
  if (!expandedId.value) return null
  return displayedEvents.value.find((e: any) => e._id === expandedId.value) || null
})

// Find which row the expanded event is in
function expandedRowIndex(): number {
  if (!expandedId.value) return -1
  const idx = displayedEvents.value.findIndex((e: any) => e._id === expandedId.value)
  return Math.floor(idx / 3)
}

// Detail panel ref for GSAP animation
const detailRefs = ref<Record<number, HTMLElement | null>>({})

function setDetailRef(rowIdx: number, el: any) {
  detailRefs.value[rowIdx] = el as HTMLElement | null
}

let currentAnimation: gsap.core.Tween | null = null

function toggleEvent(id: string) {
  const wasExpanded = expandedId.value
  const newId = wasExpanded === id ? null : id

  if (wasExpanded && wasExpanded !== id) {
    // Switching: close current, then open new
    const oldRowIdx = expandedRowIndex()
    const oldEl = detailRefs.value[oldRowIdx]
    if (oldEl) {
      currentAnimation?.kill()
      currentAnimation = gsap.to(oldEl, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete() {
          expandedId.value = newId
          nextTick(() => {
            const newRowIdx = expandedRowIndex()
            const newEl = detailRefs.value[newRowIdx]
            if (newEl) {
              animateOpen(newEl)
            }
          })
        },
      })
    } else {
      expandedId.value = newId
    }
  } else if (wasExpanded === id) {
    // Collapsing current
    const rowIdx = expandedRowIndex()
    const el = detailRefs.value[rowIdx]
    if (el) {
      currentAnimation?.kill()
      currentAnimation = gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete() {
          expandedId.value = null
        },
      })
    } else {
      expandedId.value = null
    }
  } else {
    // Opening fresh
    expandedId.value = newId
    nextTick(() => {
      const rowIdx = expandedRowIndex()
      const el = detailRefs.value[rowIdx]
      if (el) {
        animateOpen(el)
      }
    })
  }
}

function animateOpen(el: HTMLElement) {
  currentAnimation?.kill()
  currentAnimation = gsap.fromTo(
    el,
    { height: 0, opacity: 0 },
    {
      height: 'auto',
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out',
      onComplete() {
        // Scroll into view if needed
        const rect = el.getBoundingClientRect()
        if (rect.bottom > window.innerHeight || rect.top < 0) {
          const y = rect.top + window.scrollY - 100
          gsap.to(window, { scrollTo: { y, autoKill: false }, duration: 0.8, ease: 'power2.inOut' })
        }
      },
    }
  )
}

const listRef = ref<HTMLElement | null>(null)
useStaggerReveal(listRef, '.event-item')

onMounted(() => {
  if (initialEvent) {
    nextTick(() => {
      expandedId.value = initialEvent
      nextTick(() => {
        const rowIdx = expandedRowIndex()
        const el = detailRefs.value[rowIdx]
        if (el) {
          gsap.set(el, { height: 'auto', opacity: 1 })
          const rect = el.getBoundingClientRect()
          const y = rect.top + window.scrollY - 100
          gsap.to(window, { scrollTo: { y, autoKill: false }, duration: 1.5, ease: 'power2.inOut' })
        }
      })
    })
  }
})

onUnmounted(() => {
  currentAnimation?.kill()
})
</script>

<template>
  <div>
    <PageHeader title="EVENTS" />
    <section class="px-6 pb-24">
      <div class="max-w-5xl mx-auto">
        <!-- Tabs -->
        <div class="flex gap-4 mb-12">
          <button
            v-for="tab in (['upcoming', 'recent'] as const)"
            :key="tab"
            class="font-display text-sm tracking-widest uppercase px-4 py-2 rounded transition-colors"
            :class="activeTab === tab ? 'bg-accent text-dark' : 'text-white/60 hover:text-white'"
            @click="activeTab = tab; expandedId = null"
          >
            {{ tab }}
          </button>
        </div>

        <!-- Events grid -->
        <Transition name="page" mode="out-in">
          <div ref="listRef" :key="activeTab">
            <div v-if="displayedEvents.length === 0" class="text-center py-16">
              <p class="text-white/40 text-lg">
                {{ activeTab === 'upcoming' ? 'Stay tuned for upcoming events.' : 'No recent events yet.' }}
              </p>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <template v-for="(row, rowIdx) in eventRows" :key="rowIdx">
                <!-- Cards in this row -->
                <div
                  v-for="event in row"
                  :key="event._id"
                  :id="`event-${event._id}`"
                  class="event-item"
                >
                  <EventCard :event="event" @toggle="toggleEvent" />
                </div>

                <!-- Expansion panel (below row, spans all columns) -->
                <div
                  v-if="expandedEvent && expandedRowIndex() === rowIdx"
                  :ref="(el) => setDetailRef(rowIdx, el)"
                  class="col-span-1 md:col-span-3 overflow-hidden h-0 opacity-0"
                >
                  <div class="rounded-lg border border-accent/30 bg-dark-lighter shadow-[0_0_40px_rgba(0,229,255,0.08)]">
                    <!-- Featured image banner -->
                    <div v-if="expandedEvent.featuredImage" class="relative aspect-[1708/750] overflow-hidden rounded-t-lg">
                      <img
                        :src="imageUrl(expandedEvent.featuredImage)"
                        :alt="expandedEvent.title"
                        class="w-full h-full object-cover"
                      />
                      <div class="absolute inset-0 bg-gradient-to-t from-dark-lighter via-dark-lighter/60 to-transparent" />
                    </div>

                    <div class="p-6 md:p-8 space-y-6">
                      <!-- Event info -->
                      <div>
                        <h3 class="font-display text-3xl md:text-5xl tracking-wider">{{ expandedEvent.title }}</h3>
                        <div class="flex flex-wrap items-center gap-4 mt-3 text-white/60">
                          <span>{{ new Date(expandedEvent.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}</span>
                          <span v-if="expandedEvent.venue" class="text-accent">{{ expandedEvent.venue }}</span>
                          <span v-if="expandedEvent.location">{{ expandedEvent.location }}</span>
                        </div>
                      </div>

                      <!-- Description -->
                      <div v-if="expandedEvent.description" class="prose prose-invert max-w-none">
                        <SanityContent :blocks="expandedEvent.description" />
                      </div>

                      <!-- Lineup -->
                      <div v-if="expandedEvent.lineup?.length">
                        <h4 class="font-display text-xl tracking-wider mb-3">LINEUP</h4>
                        <div class="flex flex-wrap gap-2">
                          <span v-for="artist in expandedEvent.lineup" :key="artist" class="px-3 py-1 bg-white/5 rounded-full text-sm text-white/80">
                            {{ artist }}
                          </span>
                        </div>
                      </div>

                      <!-- Gallery -->
                      <div v-if="expandedEvent.gallery?.length">
                        <h4 class="font-display text-xl tracking-wider mb-3">GALLERY</h4>
                        <div class="grid grid-cols-3 md:grid-cols-4 gap-2">
                          <img
                            v-for="(img, i) in expandedEvent.gallery"
                            :key="i"
                            :src="imageUrl(img)"
                            :alt="`${expandedEvent.title} gallery ${i + 1}`"
                            class="w-full aspect-[3/2] object-cover rounded"
                          />
                        </div>
                      </div>

                      <!-- Video -->
                      <div v-if="expandedEvent.videoUrl">
                        <h4 class="font-display text-xl tracking-wider mb-3">RECAP</h4>
                        <div class="aspect-video rounded overflow-hidden">
                          <iframe :src="expandedEvent.videoUrl" class="w-full h-full" allowfullscreen />
                        </div>
                      </div>

                      <!-- Close button -->
                      <button
                        class="font-display text-sm tracking-widest uppercase text-white/40 hover:text-accent transition-colors"
                        @click="toggleEvent(expandedEvent._id)"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </Transition>
      </div>
    </section>
  </div>
</template>
```

Key implementation details:
- `eventRows` computed splits events into groups of 3
- Template uses `<template v-for>` over rows, rendering 1-3 cards then conditionally the detail panel
- Detail panel uses `col-span-1 md:col-span-3` to span full width on desktop
- `setDetailRef` uses a template ref callback to track detail panel elements per row
- `toggleEvent` handles 3 cases: close, open, switch (close then open sequentially)
- `animateOpen` scrolls into view after expansion completes
- Deep linking on mount uses `gsap.set` (instant) instead of animation for initial state

**Step 2: Commit**

```bash
git add pages/events.vue
git commit -m "feat: rewrite events page with poster grid and expand-below-row"
```

---

### Task 5: Visual verification and cleanup

**Step 1: Run the dev server**

```bash
cd /Users/sam/Desktop/SKY && npm run dev
```

**Step 2: Verify in browser at `http://localhost:3000/events`**

Check:
- [ ] Poster cards display in 3-column grid on desktop
- [ ] Single column on mobile
- [ ] Hover shows title+date with gradient overlay
- [ ] Click expands detail panel below the row with smooth animation
- [ ] Click same card collapses with smooth animation
- [ ] Switching between cards: old closes then new opens
- [ ] Tab switching (upcoming/recent) works and resets expanded state
- [ ] Deep link `?event=<id>` auto-expands and scrolls
- [ ] Stagger reveal animation on page load works
- [ ] Events without `poster` field fall back to `featuredImage`

**Step 3: Verify home page is unchanged**

Check `http://localhost:3000` — `EventsTeaser` sections should still show horizontal cards.

**Step 4: Fix any visual issues found during verification**

Common things to adjust:
- Poster card sizes / padding
- Detail panel spacing
- Scroll offset for auto-scroll
- Animation timing

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: visual polish for poster grid layout"
```

---

### Task 6: Update codebase map

**Files:**
- Modify: `/Users/sam/Desktop/SKY/docs/CODEBASE_MAP.md`

**Step 1: Update the EventCard description**

In the Components section (around line 409), update the EventCard row to reflect the new poster thumbnail behavior instead of "Expandable event card (GSAP animated)".

**Step 2: Update the events.vue description**

In the Pages section (around line 342), update to mention the 3-column poster grid and expand-below-row behavior.

**Step 3: Update the Sanity schema table**

In section 12 (around line 481), add `poster` to the event schema fields.

**Step 4: Commit**

```bash
git add docs/CODEBASE_MAP.md
git commit -m "docs: update codebase map for poster grid redesign"
```
