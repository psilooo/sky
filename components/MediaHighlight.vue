<script setup lang="ts">
const query = groq`*[_type == "mediaItem" && featured == true] | order(uploadDate desc) [0..4] {
  _id, title, mediaType, image, videoUrl, videoThumbnail, caption,
  "eventTitle": event->title
}`
const { data: items } = await useSanityQuery(query)
const { imageUrl } = useR2Image()

const containerRef = ref<HTMLElement | null>(null)
useStaggerReveal(containerRef, '.media-item')
</script>

<template>
  <section v-if="items?.length" class="pt-12 pb-24 px-6">
    <div class="max-w-7xl mx-auto">
      <h2 class="font-display text-4xl md:text-5xl tracking-wider mb-12">MEDIA</h2>
      <div ref="containerRef" class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <NuxtLink
          v-for="(item, i) in items"
          :key="item._id"
          to="/media"
          class="media-item relative overflow-hidden rounded-lg group"
          :class="i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-[4/3]'"
        >
          <img
            v-if="item.image || item.videoThumbnail"
            :src="imageUrl(item.mediaType === 'photo' ? item.image : item.videoThumbnail)"
            :alt="item.caption || item.title"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />
          <div v-if="!item.image && !item.videoThumbnail" class="w-full h-full bg-dark-card flex items-center justify-center">
            <span class="text-white/40 font-display text-lg">{{ item.title }}</span>
          </div>
          <div class="absolute inset-0 bg-white/10 backdrop-blur-[2px] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span v-if="item.mediaType === 'video'" class="text-4xl">▶</span>
          </div>
        </NuxtLink>
      </div>
      <div class="text-center mt-8">
        <NuxtLink to="/media" class="font-display text-sm tracking-widest uppercase text-accent hover:text-white transition-colors py-3 inline-flex items-center min-h-[44px]">
          View All →
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
