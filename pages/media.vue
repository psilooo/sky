<script setup lang="ts">
const query = groq`*[_type == "mediaItem"] | order(uploadDate desc) {
  _id, title, mediaType, image, videoUrl, videoThumbnail, caption, featured, uploadDate,
  "eventTitle": event->title,
  "eventId": event->_id
}`
const { data: allItems } = await useSanityQuery(query)

const eventsQuery = groq`*[_type == "event"] | order(date desc) { _id, title }`
const { data: events } = await useSanityQuery(eventsQuery)

const activeFilter = ref('all')
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

const filteredItems = computed(() => {
  if (!allItems.value) return []
  if (activeFilter.value === 'all') return allItems.value
  if (activeFilter.value === 'photo' || activeFilter.value === 'video') {
    return allItems.value.filter((item: any) => item.mediaType === activeFilter.value)
  }
  return allItems.value.filter((item: any) => item.eventId === activeFilter.value)
})

const filters = computed(() => {
  const base = [
    { label: 'All', value: 'all' },
    { label: 'Photos', value: 'photo' },
    { label: 'Videos', value: 'video' },
  ]
  const eventFilters = (events.value || []).map((e: any) => ({ label: e.title, value: e._id }))
  return [...base, ...eventFilters]
})

function openLightbox(index: number) {
  lightboxIndex.value = index
  lightboxOpen.value = true
}
</script>

<template>
  <div>
    <PageHeader title="MEDIA" />
    <section class="px-6 pb-24">
      <div class="max-w-7xl mx-auto">
        <!-- Filter bar -->
        <div class="flex flex-wrap gap-3 mb-12">
          <button
            v-for="filter in filters"
            :key="filter.value"
            class="font-display text-xs tracking-widest uppercase px-4 py-2 rounded-full border transition-all"
            :class="activeFilter === filter.value
              ? 'bg-accent text-dark border-accent'
              : 'border-white/20 text-white/60 hover:border-accent/50 hover:text-white'"
            @click="activeFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>

        <!-- Grid -->
        <MediaGrid :items="filteredItems" @select="openLightbox" />

        <!-- Empty state -->
        <div v-if="filteredItems.length === 0" class="text-center py-16">
          <p class="text-white/40 text-lg">No media found.</p>
        </div>
      </div>
    </section>

    <MediaLightbox
      :items="filteredItems"
      :current-index="lightboxIndex"
      :open="lightboxOpen"
      @close="lightboxOpen = false"
      @navigate="lightboxIndex = $event"
    />
  </div>
</template>
