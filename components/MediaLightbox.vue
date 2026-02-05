<script setup lang="ts">
const props = defineProps<{
  items: any[]
  currentIndex: number
  open: boolean
}>()
const emit = defineEmits<{ close: []; navigate: [index: number] }>()
const { imageUrl } = useR2Image()

const lightboxRef = ref<HTMLElement | null>(null)
const current = computed(() => props.items[props.currentIndex])

function next() { emit('navigate', (props.currentIndex + 1) % props.items.length) }
function prev() { emit('navigate', (props.currentIndex - 1 + props.items.length) % props.items.length) }

function onKeydown(e: KeyboardEvent) {
  if (!props.open) return
  if (e.key === 'Escape') emit('close')
  if (e.key === 'ArrowRight') next()
  if (e.key === 'ArrowLeft') prev()
  // Focus trap
  if (e.key === 'Tab' && lightboxRef.value) {
    const focusable = lightboxRef.value.querySelectorAll<HTMLElement>('button, [href], video[controls], [tabindex]:not([tabindex="-1"])')
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// Body scroll lock + focus management when lightbox is open
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    nextTick(() => {
      const closeBtn = lightboxRef.value?.querySelector<HTMLElement>('button')
      closeBtn?.focus()
    })
  } else {
    document.body.style.overflow = ''
  }
})
onUnmounted(() => { document.body.style.overflow = '' })

// Touch/swipe support for mobile navigation
let touchStartX = 0
let touchStartY = 0
function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}
function onTouchEnd(e: TouchEvent) {
  const deltaX = e.changedTouches[0].clientX - touchStartX
  const deltaY = e.changedTouches[0].clientY - touchStartY
  // Only trigger if horizontal swipe is dominant and exceeds threshold
  if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
    if (deltaX > 0) prev()
    else next()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div
        v-if="open"
        ref="lightboxRef"
        role="dialog"
        aria-modal="true"
        aria-label="Media lightbox"
        class="fixed inset-0 z-[70] bg-dark/40 backdrop-blur-2xl flex items-center justify-center"
        @click.self="emit('close')"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <button aria-label="Close lightbox" class="absolute top-4 right-4 text-white/60 hover:text-white text-2xl min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors" @click="emit('close')">&#10005;</button>
        <button aria-label="Previous item" class="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors" @click="prev">&#8249;</button>
        <button aria-label="Next item" class="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors" @click="next">&#8250;</button>

        <div class="max-w-5xl w-full mx-6 flex flex-col items-center">
          <img
            v-if="current?.mediaType === 'photo' && current?.image"
            :src="imageUrl(current.image)"
            :alt="current.caption || current.title"
            class="max-w-full max-h-[85vh] object-contain rounded-lg lightbox-glow"
          />
          <div v-else-if="current?.mediaType === 'photo'" class="flex items-center justify-center h-64">
            <span class="text-white/50 font-display text-xl">No image available</span>
          </div>
          <div
            v-else-if="current?.mediaType === 'video' && current.videoUrl && (current.videoUrl.includes('youtube') || current.videoUrl.includes('youtu.be'))"
            class="aspect-video w-full max-h-[85vh] rounded-lg lightbox-glow"
          >
            <iframe
              :src="current.videoUrl"
              :title="current.title || 'Video'"
              class="w-full h-full"
              allowfullscreen
            />
          </div>
          <video
            v-else-if="current?.mediaType === 'video' && current.videoUrl"
            :key="current._id"
            :src="current.videoUrl"
            controls
            playsinline
            class="max-w-full max-h-[85vh] rounded-lg lightbox-glow"
          />
          <p v-if="current?.caption" class="text-center text-white/50 mt-4 leading-relaxed">{{ current.caption }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lightbox-enter-active, .lightbox-leave-active { transition: opacity 0.3s ease; }
.lightbox-enter-from, .lightbox-leave-to { opacity: 0; }
.lightbox-glow { box-shadow: 0 0 40px rgba(0, 229, 255, 0.08); }
</style>
