<script setup lang="ts">
defineProps<{ title: string }>()
const titleRef = ref<HTMLElement | null>(null)
useTextReveal(titleRef)
</script>

<template>
  <div class="pt-32 pb-12 px-6">
    <div class="max-w-7xl mx-auto text-center">
      <h1 ref="titleRef" class="font-display text-6xl md:text-8xl tracking-wider inline-block">
        {{ title }}
      </h1>
    </div>
  </div>
</template>
