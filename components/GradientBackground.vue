<script setup lang="ts">
import { MeshGradient } from '@mesh-gradient/vue'
</script>

<template>
  <ClientOnly>
    <MeshGradient
      class="gradient-bg"
      aria-hidden="true"
      :options="{
        colors: ['#121212', '#00e5ff', '#121212', '#00e5ff'],
        activeColors: { 1: true, 2: true, 3: false, 4: false },
        seed: 42,
        animationSpeed: 0.4,
        frequency: { x: 0.00012, y: 0.00022, delta: 0.00008 },
      }"
    />
  </ClientOnly>
</template>

<style scoped>
.gradient-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  width: 100vw;
  height: 100vh;
}
</style>
