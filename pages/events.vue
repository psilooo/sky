<script setup lang="ts">
import { gsap } from 'gsap'

useSeoMeta({
  title: 'Events | SKY Events Asia',
  ogTitle: 'Events | SKY Events Asia',
  description: 'Upcoming and past electronic music events by SKY Events Asia.',
  ogDescription: 'Upcoming and past electronic music events by SKY Events Asia.',
})

const query = groq`*[_type == "event"] | order(date desc) {
  _id, title, date, venue, location, description, featuredImage, gallery, videoUrl, lineup
}`
const { data: events } = await useSanityQuery(query)

const route = useRoute()

const initialTab = route.query.tab === 'recent' ? 'recent' : 'upcoming'
const initialEvent = typeof route.query.event === 'string' ? route.query.event : null

const activeTab = ref<'upcoming' | 'recent'>(initialTab)
const expandedId = ref<string | null>(null)

const now = new Date().toISOString()
const upcomingEvents = computed(() => events.value?.filter((e: any) => e.date > now) || [])
const pastEvents = computed(() => events.value?.filter((e: any) => e.date <= now) || [])
const displayedEvents = computed(() => activeTab.value === 'upcoming' ? upcomingEvents.value : pastEvents.value)

function toggleEvent(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

const listRef = ref<HTMLElement | null>(null)
useStaggerReveal(listRef, '.event-item')

onMounted(() => {
  if (initialEvent) {
    nextTick(() => {
      expandedId.value = initialEvent
      const el = document.getElementById(`event-${initialEvent}`)
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 80
        gsap.to(window, { scrollTo: { y, autoKill: false }, duration: 1.5, ease: 'power2.inOut' })
      }
    })
  }
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

        <!-- Events list -->
        <Transition name="page" mode="out-in">
          <div ref="listRef" :key="activeTab" class="space-y-6">
            <div v-if="displayedEvents.length === 0" class="text-center py-16">
              <p class="text-white/40 text-lg">
                {{ activeTab === 'upcoming' ? 'Stay tuned for upcoming events.' : 'No recent events yet.' }}
              </p>
            </div>
            <div v-for="event in displayedEvents" :key="event._id" :id="`event-${event._id}`" class="event-item scroll-mt-20">
              <EventCard :event="event" :expanded="expandedId === event._id" @toggle="toggleEvent" />
            </div>
          </div>
        </Transition>
      </div>
    </section>
  </div>
</template>
