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

function scrollThenExpand(el: HTMLElement, onDone?: () => void) {
  const y = el.getBoundingClientRect().top + window.scrollY - 60
  const distance = Math.abs(y - window.scrollY)
  if (distance < 10) {
    // Already there, just expand
    animateOpen(el, onDone)
    return
  }
  // Scroll first, then expand after scroll completes
  const duration = Math.min(0.6, Math.max(0.25, distance / 2000))
  gsap.to(window, {
    scrollTo: { y, autoKill: false },
    duration,
    ease: 'power2.inOut',
    onComplete() {
      animateOpen(el, onDone)
    },
  })
}

function toggleEvent(id: string) {
  const wasExpanded = expandedId.value
  const newId = wasExpanded === id ? null : id

  if (wasExpanded && wasExpanded !== id) {
    // Switching: lock page height so closing the old panel doesn't yank the viewport
    const body = document.body
    body.style.minHeight = `${body.scrollHeight}px`

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
                scrollThenExpand(newEl, () => {
                  body.style.minHeight = ''
                })
              } else {
                body.style.minHeight = ''
              }
            })
          })
        },
      })
    } else {
      expandedId.value = newId
      body.style.minHeight = ''
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
    // Opening fresh — expand first, then scroll into view
    expandedId.value = newId
    nextTick(() => {
      const rowIdx = expandedRowIndex()
      const el = detailRefs.value[rowIdx]
      if (el) {
        animateOpen(el)
        setTimeout(() => {
          const y = el.getBoundingClientRect().top + window.scrollY - 60
          gsap.to(window, {
            scrollTo: { y, autoKill: false },
            duration: 0.4,
            ease: 'power2.inOut',
          })
        }, 200)
      }
    })
  }
}

function animateOpen(el: HTMLElement, onDone?: () => void) {
  currentAnimation?.kill()
  currentAnimation = gsap.fromTo(
    el,
    { height: 0, opacity: 0 },
    {
      height: 'auto',
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: onDone,
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
          const y = el.getBoundingClientRect().top + window.scrollY - 60
          gsap.to(window, { scrollTo: { y, autoKill: false }, duration: 0.5, ease: 'power2.inOut' })
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
        <div class="flex justify-center mb-12">
          <div class="inline-flex gap-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-1.5">
            <button
              v-for="tab in (['upcoming', 'recent'] as const)"
              :key="tab"
              class="font-display text-base tracking-widest uppercase px-8 py-1.5 rounded-lg transition-all"
              :class="activeTab === tab ? 'bg-white/10 backdrop-blur-sm text-accent border border-white/15' : 'text-white/60 hover:text-white border border-transparent'"
            @click="currentAnimation?.kill(); currentAnimation = null; expandedId = null; activeTab = tab"
          >
              {{ tab }}
            </button>
          </div>
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
                  <div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                    <!-- Featured image banner -->
                    <div v-if="expandedEvent.featuredImage" class="relative aspect-[1708/750] overflow-hidden rounded-t-lg">
                      <img
                        :src="imageUrl(expandedEvent.featuredImage)"
                        :alt="expandedEvent.title"
                        class="w-full h-full object-cover"
                      />
                    </div>

                    <div class="p-6 md:p-8 space-y-6">
                      <!-- Event info -->
                      <div>
                        <h3 class="font-display text-3xl md:text-5xl tracking-wider">{{ expandedEvent.title }}</h3>
                        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-white">
                          <span><span class="text-white/40 font-display tracking-wider text-sm">DATE:</span> {{ new Date(expandedEvent.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}</span>
                          <span v-if="expandedEvent.location"><span class="text-white/40 font-display tracking-wider text-sm">LOCATION:</span> {{ expandedEvent.location }}</span>
                          <span v-if="expandedEvent.venue"><span class="text-white/40 font-display tracking-wider text-sm">VENUE:</span> <span class="text-accent">{{ expandedEvent.venue }}</span></span>
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
                        <div class="grid grid-cols-2 md:grid-cols-4 auto-rows-[120px] md:auto-rows-[140px] gap-2">
                          <div
                            v-for="(img, i) in expandedEvent.gallery.slice(0, 5)"
                            :key="i"
                            class="overflow-hidden rounded-lg group"
                            :class="i === 0 ? 'col-span-2 md:row-span-2' : ''"
                          >
                            <img
                              :src="imageUrl(img)"
                              :alt="`${expandedEvent.title} gallery ${i + 1}`"
                              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                        </div>
                        <NuxtLink
                          v-if="expandedEvent.gallery.length > 5"
                          :to="`/media?event=${expandedEvent._id}`"
                          class="inline-block mt-3 font-display text-sm tracking-widest uppercase text-white hover:text-accent transition-colors"
                        >
                          See More ({{ expandedEvent.gallery.length }} photos) &rarr;
                        </NuxtLink>
                      </div>

                      <!-- Video -->
                      <div v-if="expandedEvent.videoUrl">
                        <h4 class="font-display text-xl tracking-wider mb-3">RECAP</h4>
                        <div
                          :class="[
                            'rounded-lg overflow-hidden',
                            (expandedEvent.videoUrl.includes('youtube') || expandedEvent.videoUrl.includes('youtu.be'))
                              ? 'aspect-video'
                              : ''
                          ]"
                        >
                          <iframe
                            v-if="expandedEvent.videoUrl.includes('youtube') || expandedEvent.videoUrl.includes('youtu.be')"
                            :src="expandedEvent.videoUrl"
                            class="w-full h-full"
                            allowfullscreen
                          />
                          <video
                            v-else
                            :src="expandedEvent.videoUrl"
                            controls
                            class="w-full rounded-lg bg-black"
                          />
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
