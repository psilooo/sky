<script setup lang="ts">
const query = groq`*[_type == "event"] | order(date desc) {
  _id, title, date, venue, location, description, featuredImage, gallery, videoUrl, lineup
}`
const { data: events } = await useSanityQuery(query)

const activeTab = ref<'upcoming' | 'past'>('upcoming')
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
</script>

<template>
  <div>
    <PageHeader title="EVENTS" />
    <section class="px-6 pb-24">
      <div class="max-w-5xl mx-auto">
        <!-- Tabs -->
        <div class="flex gap-4 mb-12">
          <button
            v-for="tab in (['upcoming', 'past'] as const)"
            :key="tab"
            class="font-display text-sm tracking-widest uppercase px-4 py-2 rounded transition-colors"
            :class="activeTab === tab ? 'bg-accent text-dark' : 'text-white/60 hover:text-white'"
            @click="activeTab = tab; expandedId = null"
          >
            {{ tab }}
          </button>
        </div>

        <!-- Events list -->
        <div ref="listRef" class="space-y-6">
          <div v-if="displayedEvents.length === 0" class="text-center py-16">
            <p class="text-white/40 text-lg">
              {{ activeTab === 'upcoming' ? 'Stay tuned for upcoming events.' : 'No past events yet.' }}
            </p>
          </div>
          <div v-for="event in displayedEvents" :key="event._id" class="event-item">
            <EventCard :event="event" :expanded="expandedId === event._id" @toggle="toggleEvent" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
