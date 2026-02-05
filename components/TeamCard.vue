<script setup lang="ts">
defineProps<{ member: { name: string; role: string; bio?: string; photo?: string } }>()
const { imageUrl } = useR2Image()
</script>

<template>
  <div class="group text-center">
    <div class="relative overflow-hidden rounded-lg aspect-[3/4] mb-4 bg-dark-lighter">
      <img
        v-if="member.photo"
        :src="imageUrl(member.photo)"
        :alt="member.name"
        class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-[filter,transform] duration-500 group-hover:scale-105"
        loading="lazy"
        @error="($event.target as HTMLImageElement).style.display = 'none'"
      />
      <div v-if="!member.photo" class="w-full h-full flex items-center justify-center">
        <span class="text-white/20 font-display text-4xl tracking-wider">{{ member.name.charAt(0) }}</span>
      </div>
    </div>
    <h3 class="font-display text-xl tracking-wider">{{ member.name }}</h3>
    <p class="text-accent text-sm mt-1">{{ member.role }}</p>
    <p v-if="member.bio" class="text-white/50 text-sm mt-2 max-w-xs mx-auto leading-relaxed">{{ member.bio }}</p>
  </div>
</template>
