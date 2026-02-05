<script setup lang="ts">
import { gsap } from 'gsap'

const sectionRef = ref<HTMLElement | null>(null)
const rotatorRef = ref<HTMLElement | null>(null)
useScrollReveal(sectionRef)

const words = ['world-class artists', 'unforgettable nights', 'underground culture', 'cutting-edge production', 'passionate communities']
const currentWord = ref(0)

let wordInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  wordInterval = setInterval(() => {
    if (!rotatorRef.value) return
    gsap.to(rotatorRef.value, {
      opacity: 0,
      y: -10,
      duration: 0.3,
      onComplete: () => {
        currentWord.value = (currentWord.value + 1) % words.length
        gsap.fromTo(rotatorRef.value!, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 })
      },
    })
  }, 2500)
})

onUnmounted(() => {
  if (wordInterval) clearInterval(wordInterval)
})
</script>

<template>
  <section class="pt-12 pb-6 px-6 border-t border-white/5">
    <div ref="sectionRef" class="max-w-4xl mx-auto flex flex-col items-center">
      <p class="text-5xl md:text-7xl lg:text-9xl font-display tracking-wide leading-snug text-center">
        <span class="text-white">BRINGING TOGETHER</span><br />
        <span ref="rotatorRef" class="text-accent inline-block" aria-live="polite" aria-atomic="true">{{ words[currentWord] }}</span>
      </p>
      <NuxtLink to="/about" class="mt-10 font-display text-sm tracking-widest uppercase text-white/50 hover:text-accent transition-colors py-3 inline-flex items-center min-h-[44px]">
        Learn More →
      </NuxtLink>
    </div>
  </section>
</template>
