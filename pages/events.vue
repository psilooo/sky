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
const router = useRouter()

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
            nextTick(() => {
              const newRowIdx = expandedRowIndex()
              const newEl = detailRefs.value[newRowIdx]
              if (newEl) {
                animateOpen(newEl)
              }
            })
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
  // Scroll to the panel immediately as it starts expanding
  const y = el.getBoundingClientRect().top + window.scrollY - 100
  gsap.to(window, { scrollTo: { y, autoKill: false }, duration: 0.4, ease: 'power2.out' })
  currentAnimation = gsap.fromTo(
    el,
    { height: 0, opacity: 0 },
    {
      height: 'auto',
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out',
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
          gsap.to(window, { scrollTo: { y, autoKill: false }, duration: 0.4, ease: 'power2.out' })
        }
        // Clear query params so refresh doesn't re-open this event
        router.replace({ query: {} })
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
            @click="currentAnimation?.kill(); currentAnimation = null; expandedId = null; activeTab = tab"
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
