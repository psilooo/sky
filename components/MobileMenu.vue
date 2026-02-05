<script setup lang="ts">
const props = defineProps<{ open: boolean; links: { label: string; to: string }[] }>()
const emit = defineEmits<{ close: [] }>()
const route = useRoute()

const menuRef = ref<HTMLElement | null>(null)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
    return
  }
  // Focus trap: cycle through focusable elements
  if (e.key === 'Tab' && menuRef.value) {
    const focusable = menuRef.value.querySelectorAll<HTMLElement>('a, button, [tabindex="0"]')
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

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    nextTick(() => {
      const firstLink = menuRef.value?.querySelector<HTMLElement>('a')
      firstLink?.focus()
    })
  } else {
    document.body.style.overflow = ''
  }
})
onUnmounted(() => { document.body.style.overflow = '' })
</script>

<template>
  <Transition name="menu">
    <div
      v-if="open"
      ref="menuRef"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
      class="fixed inset-0 z-[60] bg-dark flex flex-col items-center justify-center gap-8"
      @keydown="onKeydown"
    >
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="font-display text-4xl tracking-widest uppercase transition-colors hover:text-accent"
        :class="route.path === link.to ? 'text-accent' : 'text-white'"
        @click="emit('close')"
      >
        {{ link.label }}
      </NuxtLink>
      <button
        class="mt-4 text-white/40 hover:text-white font-display text-sm tracking-widest uppercase transition-colors"
        @click="emit('close')"
      >
        Close
        <span class="sr-only">mobile menu</span>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.3s ease;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}
</style>
