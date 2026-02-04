<script setup lang="ts">
useSeoMeta({
  title: 'Media | SKY Events Asia',
  ogTitle: 'Media | SKY Events Asia',
  description: 'Photos and videos from SKY Events Asia festivals and events.',
  ogDescription: 'Photos and videos from SKY Events Asia festivals and events.',
})

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

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Photos', value: 'photo' },
  { label: 'Videos', value: 'video' },
]

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
        <div class="flex justify-center mb-12">
          <div class="inline-flex gap-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-1.5">
            <button
              v-for="filter in filters"
              :key="filter.value"
              class="font-display text-base tracking-widest uppercase px-8 py-1.5 rounded-lg transition-all flex-1 text-center"
              :class="activeFilter === filter.value
                ? 'bg-white/10 backdrop-blur-sm text-accent border border-white/15'
                : 'text-white/60 hover:text-white border border-transparent'"
              @click="activeFilter = filter.value"
            >
              {{ filter.label }}
            </button>
          </div>
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
