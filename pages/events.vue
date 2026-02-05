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

function isReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function scrollThenExpand(el: HTMLElement, onDone?: () => void) {
  if (isReducedMotion()) {
    gsap.set(el, { height: 'auto', opacity: 1 })
    el.scrollIntoView({ block: 'nearest' })
    onDone?.()
    return
  }
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

  // Reduced motion: instant show/hide without animation
  if (isReducedMotion()) {
    if (wasExpanded) {
      const oldRowIdx = expandedRowIndex()
      const oldEl = detailRefs.value[oldRowIdx]
      if (oldEl) gsap.set(oldEl, { height: 0, opacity: 0 })
    }
    expandedId.value = newId
    if (newId) {
      nextTick(() => {
        const rowIdx = expandedRowIndex()
        const el = detailRefs.value[rowIdx]
        if (el) {
          gsap.set(el, { height: 'auto', opacity: 1 })
          el.scrollIntoView({ block: 'nearest' })
        }
      })
    }
    return
  }

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

// Gallery/video lightbox
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

const lightboxItems = computed(() => {
  if (!expandedEvent.value) return []
  const items: { type: 'video' | 'image'; src: string }[] = []
  const ev = expandedEvent.value
  if (ev.videoUrl && !(ev.videoUrl.includes('youtube') || ev.videoUrl.includes('youtu.be'))) {
    items.push({ type: 'video', src: ev.videoUrl })
  }
  if (ev.gallery?.length) {
    const limit = ev.videoUrl ? 4 : 5
    for (const img of ev.gallery.slice(0, limit)) {
      items.push({ type: 'image', src: imageUrl(img) })
    }
  }
  return items
})

function openLightbox(index: number) {
  lightboxIndex.value = index
  lightboxOpen.value = true
}
function closeLightbox() {
  lightboxOpen.value = false
}
function lightboxNext() {
  if (lightboxItems.value.length <= 1) return
  lightboxIndex.value = (lightboxIndex.value + 1) % lightboxItems.value.length
}
function lightboxPrev() {
  if (lightboxItems.value.length <= 1) return
  lightboxIndex.value = (lightboxIndex.value - 1 + lightboxItems.value.length) % lightboxItems.value.length
}
function onLightboxKey(e: KeyboardEvent) {
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowRight') lightboxNext()
  if (e.key === 'ArrowLeft') lightboxPrev()
}
watch(lightboxOpen, (open) => {
  if (open) {
    window.addEventListener('keydown', onLightboxKey)
    document.body.style.overflow = 'hidden'
  } else {
    window.removeEventListener('keydown', onLightboxKey)
    document.body.style.overflow = ''
  }
})

// Touch/swipe support for lightbox on mobile
let lbTouchStartX = 0
let lbTouchStartY = 0
function onLbTouchStart(e: TouchEvent) {
  lbTouchStartX = e.touches[0].clientX
  lbTouchStartY = e.touches[0].clientY
}
function onLbTouchEnd(e: TouchEvent) {
  const deltaX = e.changedTouches[0].clientX - lbTouchStartX
  const deltaY = e.changedTouches[0].clientY - lbTouchStartY
  if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
    if (deltaX > 0) lightboxPrev()
    else lightboxNext()
  }
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
          if (isReducedMotion()) {
            el.scrollIntoView({ block: 'nearest' })
          } else {
            const y = el.getBoundingClientRect().top + window.scrollY - 60
            gsap.to(window, { scrollTo: { y, autoKill: false }, duration: 0.5, ease: 'power2.inOut' })
          }
        }
        // Clear query params so refresh doesn't re-open this event
        router.replace({ query: {} })
      })
    })
  }
})

onUnmounted(() => {
  currentAnimation?.kill()
  window.removeEventListener('keydown', onLightboxKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <div>
    <PageHeader title="EVENTS" />
    <section class="px-6 pb-24">
      <div class="max-w-5xl mx-auto">
        <!-- Tabs -->
        <div class="flex justify-center mb-12">
          <div role="tablist" aria-label="Event categories" class="inline-flex gap-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-1.5">
            <button
              v-for="tab in (['upcoming', 'recent'] as const)"
              :key="tab"
              role="tab"
              :id="`tab-${tab}`"
              :aria-selected="activeTab === tab"
              :aria-controls="`tabpanel-${tab}`"
              class="font-display text-base tracking-widest uppercase px-6 sm:px-8 py-2.5 rounded-lg transition-[background-color,color,border-color] duration-200 min-h-[44px]"
              :class="activeTab === tab ? 'bg-white/10 backdrop-blur-sm text-accent border border-white/15' : 'text-white/60 hover:text-white border border-transparent'"
              @click="currentAnimation?.kill(); currentAnimation = null; expandedId = null; activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>
        </div>

        <!-- Events grid -->
        <Transition name="page" mode="out-in">
          <div ref="listRef" :key="activeTab" role="tabpanel" :id="`tabpanel-${activeTab}`" :aria-labelledby="`tab-${activeTab}`">
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
                    <div v-if="expandedEvent.featuredImage" class="relative aspect-[1708/750] overflow-hidden rounded-t-lg bg-dark-lighter">
                      <img
                        :src="imageUrl(expandedEvent.featuredImage)"
                        :alt="expandedEvent.title"
                        class="w-full h-full object-cover"
                        loading="lazy"
                        @error="($event.target as HTMLImageElement).style.display = 'none'"
                      />
                    </div>

                    <div class="p-6 md:p-8 space-y-6">
                      <!-- Event info -->
                      <div>
                        <h3 class="font-display text-3xl md:text-5xl tracking-wider break-words">{{ expandedEvent.title }}</h3>
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

                      <!-- Gallery (video as hero item if present) -->
                      <div v-if="expandedEvent.gallery?.length || expandedEvent.videoUrl">
                        <h4 class="font-display text-xl tracking-wider mb-3">GALLERY</h4>
                        <div class="grid grid-cols-2 md:grid-cols-4 auto-rows-[120px] md:auto-rows-[140px] gap-2">
                          <!-- Video hero (self-hosted) -->
                          <div
                            v-if="expandedEvent.videoUrl && !(expandedEvent.videoUrl.includes('youtube') || expandedEvent.videoUrl.includes('youtu.be'))"
                            role="button"
                            tabindex="0"
                            :aria-label="`Play ${expandedEvent.title} video`"
                            class="overflow-hidden rounded-lg col-span-2 md:row-span-2 relative cursor-pointer group"
                            @click="openLightbox(0)"
                            @keydown.enter="openLightbox(0)"
                            @keydown.space.prevent="openLightbox(0)"
                          >
                            <video
                              :src="expandedEvent.videoUrl"
                              preload="metadata"
                              muted
                              playsinline
                              class="w-full h-full object-cover"
                            />
                            <div class="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                              <span class="text-5xl text-white/80 group-hover:text-white transition-colors">&#9654;</span>
                            </div>
                          </div>
                          <!-- Video hero (YouTube) -->
                          <div
                            v-else-if="expandedEvent.videoUrl"
                            class="overflow-hidden rounded-lg col-span-2 md:row-span-2"
                          >
                            <iframe
                              :src="expandedEvent.videoUrl"
                              :title="`${expandedEvent.title} video`"
                              class="w-full h-full"
                              allowfullscreen
                            />
                          </div>
                          <!-- Gallery images -->
                          <div
                            v-for="(img, i) in expandedEvent.gallery?.slice(0, expandedEvent.videoUrl ? 4 : 5) || []"
                            :key="i"
                            role="button"
                            tabindex="0"
                            :aria-label="`View ${expandedEvent.title} gallery image ${i + 1}`"
                            class="overflow-hidden rounded-lg group cursor-pointer"
                            :class="!expandedEvent.videoUrl && i === 0 ? 'col-span-2 md:row-span-2' : ''"
                            @click="openLightbox(expandedEvent.videoUrl && !(expandedEvent.videoUrl.includes('youtube') || expandedEvent.videoUrl.includes('youtu.be')) ? i + 1 : i)"
                            @keydown.enter="openLightbox(expandedEvent.videoUrl && !(expandedEvent.videoUrl.includes('youtube') || expandedEvent.videoUrl.includes('youtu.be')) ? i + 1 : i)"
                            @keydown.space.prevent="openLightbox(expandedEvent.videoUrl && !(expandedEvent.videoUrl.includes('youtube') || expandedEvent.videoUrl.includes('youtu.be')) ? i + 1 : i)"
                          >
                            <img
                              :src="imageUrl(img)"
                              :alt="`${expandedEvent.title} gallery ${i + 1}`"
                              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                              @error="($event.target as HTMLImageElement).style.display = 'none'"
                            />
                          </div>
                        </div>
                        <NuxtLink
                          v-if="expandedEvent.gallery?.length > (expandedEvent.videoUrl ? 4 : 5)"
                          :to="`/media?event=${expandedEvent._id}`"
                          class="inline-block mt-3 font-display text-sm tracking-widest uppercase text-white hover:text-accent transition-colors py-2 min-h-[44px]"
                        >
                          See More ({{ expandedEvent.gallery.length }} photos) &rarr;
                        </NuxtLink>
                      </div>

                      <!-- Close button -->
                      <button
                        class="font-display text-sm tracking-widest uppercase text-white/40 hover:text-accent transition-colors py-3 min-h-[44px]"
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

    <!-- Gallery lightbox -->
    <Teleport to="body">
      <Transition name="lightbox">
        <div v-if="lightboxOpen && lightboxItems.length" role="dialog" aria-modal="true" aria-label="Gallery lightbox" class="fixed inset-0 z-[70] bg-dark/40 backdrop-blur-2xl flex items-center justify-center" @click.self="closeLightbox" @touchstart.passive="onLbTouchStart" @touchend.passive="onLbTouchEnd">
          <button aria-label="Close lightbox" class="absolute top-4 right-4 text-white/60 hover:text-white text-2xl min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors" @click="closeLightbox">&#10005;</button>
          <button v-if="lightboxItems.length > 1" aria-label="Previous image" class="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors" @click="lightboxPrev">&#8249;</button>
          <button v-if="lightboxItems.length > 1" aria-label="Next image" class="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors" @click="lightboxNext">&#8250;</button>
          <div class="max-w-5xl w-full mx-6 flex flex-col items-center">
            <video
              v-if="lightboxItems[lightboxIndex]?.type === 'video'"
              :key="lightboxItems[lightboxIndex].src"
              :src="lightboxItems[lightboxIndex].src"
              controls
              autoplay
              playsinline
              class="max-w-full max-h-[85vh] rounded-lg"
              style="box-shadow: 0 0 40px rgba(0, 229, 255, 0.08);"
            />
            <img
              v-else-if="lightboxItems[lightboxIndex]?.type === 'image'"
              :key="lightboxItems[lightboxIndex].src"
              :src="lightboxItems[lightboxIndex].src"
              :alt="`Gallery image ${lightboxIndex + 1}`"
              class="max-w-full max-h-[85vh] object-contain rounded-lg"
              style="box-shadow: 0 0 40px rgba(0, 229, 255, 0.08);"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.lightbox-enter-active, .lightbox-leave-active { transition: opacity 0.3s ease; }
.lightbox-enter-from, .lightbox-leave-to { opacity: 0; }
</style>
