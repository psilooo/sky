<script setup lang="ts">
import { gsap } from 'gsap'

const query = groq`*[_type == "siteSettings"][0]{ heroTagline, heroVideoUrl, heroFallbackImage }`
const { data: settings } = await useSanityQuery(query)
const { imageUrl } = useR2Image()

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
        autoplay
        loop
        muted
        playsinline
        poster="/hero-poster.jpg"
        preload="metadata"
        class="hidden md:block w-full h-full object-cover"
      >
        <source :src="settings.heroVideoUrl" type="video/mp4" />
      </video>
      <!-- Fallback image (shown on mobile, or when no video) -->
      <img
        v-if="settings?.heroFallbackImage"
        :src="imageUrl(settings.heroFallbackImage)"
        alt=""
        class="w-full h-full object-cover"
        :class="settings?.heroVideoUrl ? 'md:hidden' : ''"
      />
    </div>
    <!-- Color tint overlay -->
    <div class="absolute inset-0 z-[2] bg-gradient-to-br from-[#FF7A90]/10 via-black/40 to-[#8D9EC6]/15 pointer-events-none" />
    <!-- Vignette overlay -->
    <div class="absolute inset-0 z-[2] pointer-events-none" style="background: radial-gradient(ellipse at center, transparent 20%, rgba(10,10,10,0.65) 100%)" />
    <!-- Bottom fade -->
    <div class="absolute bottom-0 left-0 right-0 h-1/3 z-[2] bg-gradient-to-b from-transparent to-[#0a0a0a] pointer-events-none" />
    <!-- Logo with frosted glass -->
    <div ref="taglineRef" class="relative z-10 backdrop-blur-md bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-10">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="-57 0 445.613 334.189" class="w-64 md:w-96 lg:w-[500px] fill-white">
        <path d="M360.522,193.273c15.151-.49,28.173,12.558,28.091,28.166-.083,15.78-12.661,27.941-28.515,28.129-14.945.178-28.331-13.022-28.064-28.822.229-13.573,12.21-28.226,28.489-27.473Z"/>
        <text font-family="Anton-Regular, Anton" font-size="266.208" letter-spacing="-.054em" transform="translate(0 247.49)"><tspan x="0" y="0">SEA</tspan></text>
        <text font-family="Anton-Regular, Anton" font-size="60.49" letter-spacing="-.054em" transform="translate(5.46 311.578)"><tspan x="0" y="0">SKY EVENTS ASIA</tspan></text>
      </svg>
    </div>
    <!-- Scroll indicator -->
    <div ref="scrollIndicator" class="absolute bottom-8 left-1/2 -translate-x-1/2 z-[3] text-accent drop-shadow-[0_0_6px_rgba(0,229,255,0.5)]">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7" />
      </svg>
    </div>
  </section>
</template>
