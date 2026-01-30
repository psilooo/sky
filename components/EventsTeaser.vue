<script setup lang="ts">
const query = groq`*[_type == "event" && date > now()] | order(date asc) [0..2] { _id, title, date, venue, featuredImage }`
const { data: events } = await useSanityQuery(query)
const { urlFor } = useSanityImageUrl()

const containerRef = ref<HTMLElement | null>(null)
useStaggerReveal(containerRef, '.event-card')
</script>

<template>
  <section v-if="events?.length" class="py-24 px-6">
    <div class="max-w-7xl mx-auto">
      <h2 class="font-display text-4xl md:text-5xl tracking-wider mb-12">UPCOMING EVENTS</h2>
      <div ref="containerRef" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="event in events"
          :key="event._id"
          to="/events"
          class="event-card group relative overflow-hidden rounded-lg aspect-[4/3] cursor-pointer"
        >
          <img
            v-if="event.featuredImage"
            :src="urlFor(event.featuredImage).width(600).height(450).url()"
            :alt="event.title"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
          <div class="absolute bottom-0 left-0 right-0 p-6">
            <h3 class="font-display text-2xl tracking-wider">{{ event.title }}</h3>
            <p class="text-white/60 mt-1">{{ new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}</p>
            <p v-if="event.venue" class="text-accent text-sm mt-1">{{ event.venue }}</p>
          </div>
          <div class="absolute inset-0 border border-transparent group-hover:border-accent/30 group-hover:shadow-[0_0_30px_rgba(0,229,255,0.1)] rounded-lg transition-all duration-300" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
