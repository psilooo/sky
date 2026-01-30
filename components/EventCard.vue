<script setup lang="ts">
import { gsap } from 'gsap'
import type { SanityDocument } from '@sanity/client'

const props = defineProps<{ event: SanityDocument; expanded: boolean }>()
const emit = defineEmits<{ toggle: [id: string] }>()
const { urlFor } = useSanityImageUrl()
const contentRef = ref<HTMLElement | null>(null)

watch(() => props.expanded, (val) => {
  if (!contentRef.value) return
  if (val) {
    gsap.fromTo(contentRef.value, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.5, ease: 'power2.out' })
  } else {
    gsap.to(contentRef.value, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.in' })
  }
})
</script>

<template>
  <div
    class="group relative overflow-hidden rounded-lg border border-white/5 hover:border-accent/30 transition-all duration-300"
    :class="expanded ? 'border-accent/30 shadow-[0_0_40px_rgba(0,229,255,0.08)]' : ''"
  >
    <!-- Card header (always visible) -->
    <button class="w-full text-left" @click="emit('toggle', event._id)">
      <div class="relative h-48 md:h-56 overflow-hidden">
        <img
          v-if="event.featuredImage"
          :src="urlFor(event.featuredImage).width(1200).height(400).url()"
          :alt="event.title"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-transparent" />
        <div class="absolute bottom-0 left-0 right-0 p-6">
          <h3 class="font-display text-3xl md:text-4xl tracking-wider">{{ event.title }}</h3>
          <div class="flex items-center gap-4 mt-2 text-white/60">
            <span>{{ new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}</span>
            <span v-if="event.venue" class="text-accent">{{ event.venue }}</span>
            <span v-if="event.location">{{ event.location }}</span>
          </div>
        </div>
      </div>
    </button>

    <!-- Expanded content -->
    <div ref="contentRef" class="h-0 opacity-0 overflow-hidden">
      <div class="p-6 space-y-6">
        <!-- Description -->
        <div v-if="event.description" class="prose prose-invert max-w-none">
          <SanityContent :blocks="event.description" />
        </div>

        <!-- Lineup -->
        <div v-if="event.lineup?.length">
          <h4 class="font-display text-xl tracking-wider mb-3">LINEUP</h4>
          <div class="flex flex-wrap gap-2">
            <span v-for="artist in event.lineup" :key="artist" class="px-3 py-1 bg-white/5 rounded-full text-sm text-white/80">
              {{ artist }}
            </span>
          </div>
        </div>

        <!-- Gallery -->
        <div v-if="event.gallery?.length">
          <h4 class="font-display text-xl tracking-wider mb-3">GALLERY</h4>
          <div class="grid grid-cols-3 md:grid-cols-4 gap-2">
            <img
              v-for="(img, i) in event.gallery"
              :key="i"
              :src="urlFor(img).width(300).height(200).url()"
              :alt="`${event.title} gallery ${i + 1}`"
              class="w-full aspect-[3/2] object-cover rounded"
            />
          </div>
        </div>

        <!-- Video -->
        <div v-if="event.videoUrl">
          <h4 class="font-display text-xl tracking-wider mb-3">RECAP</h4>
          <div class="aspect-video rounded overflow-hidden">
            <iframe :src="event.videoUrl" class="w-full h-full" allowfullscreen />
          </div>
        </div>

        <!-- Close button -->
        <button
          class="font-display text-sm tracking-widest uppercase text-white/40 hover:text-accent transition-colors"
          @click="emit('toggle', event._id)"
        >
          Close ✕
        </button>
      </div>
    </div>
  </div>
</template>
