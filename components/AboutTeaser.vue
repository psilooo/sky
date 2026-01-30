<script setup lang="ts">
const query = groq`*[_type == "siteSettings"][0]{ aboutTeaser }`
const { data: settings } = await useSanityQuery(query)

const sectionRef = ref<HTMLElement | null>(null)
useScrollReveal(sectionRef)
</script>

<template>
  <section class="py-24 px-6 bg-dark-lighter">
    <div ref="sectionRef" class="max-w-4xl mx-auto text-center">
      <p class="text-xl md:text-2xl text-white/70 leading-relaxed">
        {{ settings?.aboutTeaser || 'Bringing underground electronic music to Asia.' }}
      </p>
      <NuxtLink to="/about" class="inline-block mt-8 font-display text-sm tracking-widest uppercase text-accent hover:text-white transition-colors">
        Learn More →
      </NuxtLink>
    </div>
  </section>
</template>
