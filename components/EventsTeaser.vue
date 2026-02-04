<script setup lang="ts">
import { gsap } from 'gsap'

const props = withDefaults(defineProps<{
  type?: 'upcoming' | 'recent'
}>(), { type: 'upcoming' })

const isUpcoming = props.type === 'upcoming'
const query = isUpcoming
  ? groq`*[_type == "event" && date > now()] | order(date asc) [0..2] { _id, title, date, venue, featuredImage }`
  : groq`*[_type == "event" && date <= now()] | order(date desc) [0..2] { _id, title, date, venue, featuredImage }`
const { data: events } = await useSanityQuery(query)
const { imageUrl } = useR2Image()

const containerRef = ref<HTMLElement | null>(null)
onMounted(() => {
  if (!containerRef.value) return
  const children = containerRef.value.querySelectorAll('.event-card')
  gsap.from(children, {
    y: 60,
    opacity: 0,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power3.out',
    onComplete() { gsap.set(children, { clearProps: 'all' }) },
  })
})
</script>

<template>
  <section v-if="events?.length" class="pt-12 pb-12 px-6">
    <div class="max-w-5xl mx-auto">
      <h2 class="font-display text-4xl md:text-5xl tracking-wider mb-12">{{ isUpcoming ? 'UPCOMING EVENTS' : 'RECENT EVENTS' }}</h2>
      <div ref="containerRef" class="space-y-6">
        <NuxtLink
          v-for="event in events"
          :key="event._id"
          :to="`/events?tab=${type}&event=${event._id}`"
          class="event-card group block relative overflow-hidden rounded-lg border border-white/5 hover:border-accent/30 transition-all duration-300 cursor-pointer"
        >
          <div class="relative aspect-[1708/750] overflow-hidden">
            <img
              v-if="event.featuredImage"
              :src="imageUrl(event.featuredImage)"
              :alt="event.title"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/40 via-white/5 to-transparent backdrop-blur-md"
              style="-webkit-mask-image: linear-gradient(to top, black 0%, transparent 60%); mask-image: linear-gradient(to top, black 0%, transparent 60%)"
            />
            <div class="absolute bottom-0 left-0 right-0 p-6">
              <h3 class="font-display text-3xl md:text-4xl tracking-wider">{{ event.title }}</h3>
              <div class="flex items-center gap-4 mt-2 text-white/60">
                <span>{{ new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}</span>
                <span v-if="event.venue" class="text-accent">{{ event.venue }}</span>
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
