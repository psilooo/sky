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

const eventGalleryQuery = groq`*[_type == "event" && (count(gallery) > 0 || defined(videoUrl))] | order(date desc) {
  _id, title, gallery, videoUrl
}`
const { data: eventGalleries } = await useSanityQuery(eventGalleryQuery)

const route = useRoute()

const activeFilter = ref(typeof route.query.event === 'string' ? route.query.event : 'all')
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

// Transform event gallery URLs into mediaItem-compatible shapes and merge with real mediaItems
const mergedItems = computed(() => {
  const items: any[] = []

  // Add real mediaItems first
  if (allItems.value) {
    items.push(...allItems.value)
  }

  // Add event gallery images and videos
  if (eventGalleries.value) {
    for (const event of eventGalleries.value) {
      // Gallery images
      if (event.gallery?.length) {
        for (let i = 0; i < event.gallery.length; i++) {
          items.push({
            _id: `${event._id}-gallery-${i}`,
            title: event.title,
            mediaType: 'photo',
            image: event.gallery[i],
            eventTitle: event.title,
            eventId: event._id,
          })
        }
      }
      // Video
      if (event.videoUrl) {
        items.push({
          _id: `${event._id}-video`,
          title: `${event.title} Recap`,
          mediaType: 'video',
          videoUrl: event.videoUrl,
          eventTitle: event.title,
          eventId: event._id,
        })
      }
    }
  }

  return items
})

const filteredItems = computed(() => {
  if (!mergedItems.value.length) return []
  if (activeFilter.value === 'all') return mergedItems.value
  if (activeFilter.value === 'photo' || activeFilter.value === 'video') {
    return mergedItems.value.filter((item: any) => item.mediaType === activeFilter.value)
  }
  // Filter by event ID
  return mergedItems.value.filter((item: any) => item.eventId === activeFilter.value)
})

// Auto-generate filter pills from all unique events in mergedItems
const filters = computed(() => {
  const base = [
    { label: 'All', value: 'all' },
    { label: 'Photos', value: 'photo' },
    { label: 'Videos', value: 'video' },
  ]

  const eventMap = new Map<string, string>()
  for (const item of mergedItems.value) {
    if (item.eventId && item.eventTitle && !eventMap.has(item.eventId)) {
      eventMap.set(item.eventId, item.eventTitle)
    }
  }

  const eventFilters = Array.from(eventMap.entries()).map(([id, title]) => ({
    label: title,
    value: id,
  }))

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
        <div class="flex justify-center mb-12">
          <div class="inline-flex gap-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-1.5 overflow-x-auto">
            <button
              v-for="filter in filters"
              :key="filter.value"
              class="font-display text-base tracking-widest uppercase px-8 py-1.5 rounded-lg transition-all flex-shrink-0 text-center whitespace-nowrap"
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
