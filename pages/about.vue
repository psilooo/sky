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
    <!-- Hero -->
    <section class="relative h-[60vh] flex items-center justify-center overflow-hidden">
      <img
        v-if="settings?.aboutHeroImage"
        :src="imageUrl(settings.aboutHeroImage)"
        alt=""
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div class="relative z-10 text-center">
        <PageHeader title="ABOUT" />
        <p class="text-xl text-white/60 mt-2 px-6">Where Sound Becomes Energy.</p>
      </div>
    </section>

    <!-- Story -->
    <section class="pt-4 pb-24 px-6">
      <div ref="storyRef" class="max-w-3xl mx-auto prose prose-invert prose-lg">
        <SanityContent v-if="settings?.aboutStory" :blocks="settings.aboutStory" />
      </div>
    </section>


  </div>
</template>
