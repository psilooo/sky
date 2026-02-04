<script setup lang="ts">
const props = defineProps<{ items: any[] }>()
const emit = defineEmits<{ select: [index: number] }>()
const { imageUrl } = useR2Image()

const containerRef = ref<HTMLElement | null>(null)
useStaggerReveal(containerRef, '.media-card')

function getSize(item: any, index: number): string {
  if (item.featured) return 'col-span-2 row-span-2'
  if (index % 5 === 0) return 'col-span-2'
  return ''
}
</script>

<template>
  <div ref="containerRef" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[200px] md:auto-rows-[250px]">
    <div
      v-for="(item, i) in items"
      :key="item._id"
      class="media-card relative overflow-hidden rounded-lg cursor-pointer group"
      :class="getSize(item, i)"
      @click="emit('select', i)"
    >
      <img
        v-if="item.image || item.videoThumbnail"
        :src="imageUrl(item.mediaType === 'photo' ? item.image : item.videoThumbnail)"
        :alt="item.caption || item.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div v-else class="w-full h-full bg-dark-card flex items-center justify-center">
        <span class="text-white/20 font-display text-sm">{{ item.title }}</span>
      </div>
      <div class="absolute inset-0 bg-white/0 group-hover:bg-white/5 group-hover:backdrop-blur-md group-hover:border group-hover:border-white/10 transition-all flex items-center justify-center">
        <span v-if="item.mediaType === 'video'" class="text-4xl opacity-70 group-hover:opacity-100 transition-opacity">&#9654;</span>
      </div>
      <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <p v-if="item.eventTitle" class="text-xs text-accent">{{ item.eventTitle }}</p>
        <p v-if="item.caption" class="text-sm text-white/80">{{ item.caption }}</p>
      </div>
    </div>
  </div>
</template>
