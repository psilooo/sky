<script setup lang="ts">
import { gsap } from 'gsap'

const query = groq`*[_type == "siteSettings"][0]{ heroTagline, heroVideoUrl, heroFallbackImage }`
const { data: settings } = await useSanityQuery(query)
const { urlFor } = useSanityImageUrl()

const heroRef = ref<HTMLElement | null>(null)
const taglineRef = ref<HTMLElement | null>(null)
const scrollIndicator = ref<HTMLElement | null>(null)

onMounted(() => {
  if (taglineRef.value) {
    gsap.from(taglineRef.value, { opacity: 0, y: 30, duration: 1.5, delay: 0.5, ease: 'power3.out' })
  }
  if (scrollIndicator.value) {
    gsap.to(scrollIndicator.value, { y: 10, repeat: -1, yoyo: true, duration: 1.5, ease: 'power1.inOut' })
  }
  if (heroRef.value) {
    gsap.to(heroRef.value, {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: { trigger: heroRef.value, start: 'top top', end: 'bottom top', scrub: true },
    })
  }
})
</script>

<template>
  <section class="relative h-screen overflow-hidden flex items-center justify-center">
    <div ref="heroRef" class="absolute inset-0">
      <!-- Video on desktop -->
      <video
        v-if="settings?.heroVideoUrl"
        :src="settings.heroVideoUrl"
        autoplay
        loop
        muted
        playsinline
        class="hidden md:block w-full h-full object-cover"
      />
      <!-- Fallback image (shown on mobile, or when no video) -->
      <img
        v-if="settings?.heroFallbackImage"
        :src="urlFor(settings.heroFallbackImage).width(1920).url()"
        alt=""
        class="w-full h-full object-cover"
        :class="settings?.heroVideoUrl ? 'md:hidden' : ''"
      />
      <div class="absolute inset-0 bg-dark/60" />
    </div>
    <!-- Content -->
    <div class="relative z-10 text-center">
      <h1 class="font-display text-6xl md:text-8xl lg:text-9xl tracking-wider">
        SKY EVENTS ASIA
      </h1>
      <p v-if="settings?.heroTagline" ref="taglineRef" class="mt-6 text-lg md:text-xl text-white/70 tracking-wide">
        {{ settings.heroTagline }}
      </p>
    </div>
    <!-- Scroll indicator -->
    <div ref="scrollIndicator" class="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7" />
      </svg>
    </div>
  </section>
</template>
