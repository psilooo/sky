<script setup lang="ts">
const settingsQuery = groq`*[_type == "siteSettings"][0]{ aboutStory, aboutHeroImage, aboutTagline }`
const teamQuery = groq`*[_type == "teamMember"] | order(order asc) { _id, name, role, bio, photo }`

const { data: settings } = await useSanityQuery(settingsQuery)
const { data: team } = await useSanityQuery(teamQuery)
const { urlFor } = useSanityImageUrl()

const storyRef = ref<HTMLElement | null>(null)
const teamRef = ref<HTMLElement | null>(null)
useScrollReveal(storyRef)
useStaggerReveal(teamRef, '.team-card')
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative h-[60vh] flex items-center justify-center overflow-hidden">
      <img
        v-if="settings?.aboutHeroImage"
        :src="urlFor(settings.aboutHeroImage).width(1920).url()"
        alt=""
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-dark/70" />
      <div class="relative z-10 text-center">
        <PageHeader title="ABOUT" />
        <p v-if="settings?.aboutTagline" class="text-xl text-white/60 mt-2 px-6">{{ settings.aboutTagline }}</p>
      </div>
    </section>

    <!-- Story -->
    <section class="py-24 px-6">
      <div ref="storyRef" class="max-w-3xl mx-auto prose prose-invert prose-lg">
        <SanityContent v-if="settings?.aboutStory" :blocks="settings.aboutStory" />
      </div>
    </section>

    <!-- Team -->
    <section v-if="team?.length" class="py-24 px-6 bg-dark-lighter">
      <div class="max-w-5xl mx-auto">
        <h2 class="font-display text-4xl md:text-5xl tracking-wider mb-12 text-center">THE TEAM</h2>
        <div ref="teamRef" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <div v-for="member in team" :key="member._id" class="team-card">
            <TeamCard :member="member" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
