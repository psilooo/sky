<script setup lang="ts">
const route = useRoute()
const scrolled = ref(false)
const mobileMenuOpen = ref(false)

const links = [
  { label: 'Events', to: '/events' },
  { label: 'About', to: '/about' },
  { label: 'Media', to: '/media' },
  { label: 'Contact', to: '/contact' },
]

function onScroll() {
  scrolled.value = window.scrollY > 50
}

onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

watch(() => route.path, () => { mobileMenuOpen.value = false })
</script>

<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4"
    :class="scrolled ? 'bg-dark/95 backdrop-blur-sm' : 'bg-transparent'"
  >
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <NuxtLink to="/" class="font-display text-2xl tracking-wider text-white hover:text-accent transition-colors">
        SKY EVENTS ASIA
      </NuxtLink>
      <!-- Desktop links -->
      <div class="hidden md:flex items-center gap-8">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="font-display text-sm tracking-widest uppercase transition-colors hover:text-accent"
          :class="route.path === link.to ? 'text-accent' : 'text-white/80'"
        >
          {{ link.label }}
        </NuxtLink>
      </div>
      <!-- Mobile hamburger -->
      <button
        class="md:hidden text-white"
        @click="mobileMenuOpen = !mobileMenuOpen"
        aria-label="Toggle menu"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </nav>
  <MobileMenu :open="mobileMenuOpen" :links="links" @close="mobileMenuOpen = false" />
</template>
