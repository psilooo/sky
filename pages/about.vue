<script setup lang="ts">
useSeoMeta({
  title: 'About | SKY Events Asia',
  ogTitle: 'About | SKY Events Asia',
  description: 'Learn about SKY Events Asia — our story, mission, and the team behind the festivals.',
  ogDescription: 'Learn about SKY Events Asia — our story, mission, and the team behind the festivals.',
})

const settingsQuery = groq`*[_type == "siteSettings"][0]{ aboutStory, aboutHeroImage, aboutTagline }`

const { data: settings } = await useSanityQuery(settingsQuery)
const { imageUrl } = useR2Image()

const storyRef = ref<HTMLElement | null>(null)
useScrollReveal(storyRef)
</script>

<template>
  <div>
    <PageHeader title="ABOUT" />
    <div class="-mt-6 text-center">
      <p v-if="settings?.aboutTagline" class="text-xl text-white/60 px-6">{{ settings.aboutTagline }}</p>
    </div>

    <!-- Story -->
    <section class="pt-6 pb-24 px-6">
      <div ref="storyRef" class="max-w-3xl mx-auto prose prose-invert prose-lg bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 md:p-12">
        <SanityContent v-if="settings?.aboutStory" :blocks="settings.aboutStory" />
      </div>
    </section>


  </div>
</template>
