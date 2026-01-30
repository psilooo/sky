<script setup lang="ts">
defineProps<{ member: { name: string; role: string; bio?: string; photo?: any } }>()
const { urlFor } = useSanityImageUrl()
</script>

<template>
  <div class="group text-center">
    <div class="relative overflow-hidden rounded-lg aspect-[3/4] mb-4">
      <img
        v-if="member.photo"
        :src="urlFor(member.photo).width(400).height(533).url()"
        :alt="member.name"
        class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
      />
    </div>
    <h3 class="font-display text-xl tracking-wider">{{ member.name }}</h3>
    <p class="text-accent text-sm mt-1">{{ member.role }}</p>
    <p v-if="member.bio" class="text-white/50 text-sm mt-2 max-w-xs mx-auto">{{ member.bio }}</p>
  </div>
</template>
