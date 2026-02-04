<script setup lang="ts">
import type { SanityDocument } from '@sanity/client'

defineProps<{ event: SanityDocument }>()
const emit = defineEmits<{ toggle: [id: string] }>()
const { imageUrl } = useR2Image()
</script>

<template>
  <button
    class="group relative w-full overflow-hidden rounded-lg border border-white/5 hover:border-accent/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(0,229,255,0.08)] cursor-pointer"
    @click="emit('toggle', event._id)"
  >
    <div class="relative aspect-[1349/1685] overflow-hidden">
      <img
        v-if="event.poster || event.featuredImage"
        :src="imageUrl(event.poster || event.featuredImage)"
        :alt="event.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div class="absolute inset-0 bg-dark/40" />
      <!-- Hover overlay: gradient + text -->
      <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div class="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <h3 class="font-display text-xl md:text-2xl tracking-wider leading-tight">{{ event.title }}</h3>
        <p class="text-white/60 text-sm mt-1">
          {{ new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}
        </p>
      </div>
    </div>
  </button>
</template>
