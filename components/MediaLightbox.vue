<script setup lang="ts">
const props = defineProps<{
  items: any[]
  currentIndex: number
  open: boolean
}>()
const emit = defineEmits<{ close: []; navigate: [index: number] }>()
const { imageUrl } = useR2Image()

const current = computed(() => props.items[props.currentIndex])

function next() { emit('navigate', (props.currentIndex + 1) % props.items.length) }
function prev() { emit('navigate', (props.currentIndex - 1 + props.items.length) % props.items.length) }

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
  if (e.key === 'ArrowRight') next()
  if (e.key === 'ArrowLeft') prev()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div v-if="open" class="fixed inset-0 z-50 bg-dark/95 flex items-center justify-center" @click.self="emit('close')">
        <button class="absolute top-6 right-6 text-white/60 hover:text-white text-2xl" @click="emit('close')">&#10005;</button>
        <button class="absolute left-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl" @click="prev">&#8249;</button>
        <button class="absolute right-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl" @click="next">&#8250;</button>

        <div class="max-w-5xl max-h-[85vh] w-full mx-6">
          <img
            v-if="current?.mediaType === 'photo' && current?.image"
            :src="imageUrl(current.image)"
            :alt="current.caption || current.title"
            class="w-full h-full object-contain"
          />
          <div v-else-if="current?.mediaType === 'photo'" class="flex items-center justify-center h-64">
            <span class="text-white/30 font-display text-xl">No image available</span>
          </div>
          <div v-else-if="current?.mediaType === 'video'" class="aspect-video">
            <iframe :src="current.videoUrl" class="w-full h-full" allowfullscreen />
          </div>
          <p v-if="current?.caption" class="text-center text-white/50 mt-4">{{ current.caption }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lightbox-enter-active, .lightbox-leave-active { transition: opacity 0.3s ease; }
.lightbox-enter-from, .lightbox-leave-to { opacity: 0; }
</style>
