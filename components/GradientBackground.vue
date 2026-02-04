<script setup lang="ts">
import { MeshGradient } from '@mesh-gradient/vue'
</script>

<template>
  <ClientOnly>
    <MeshGradient
      class="gradient-bg"
      aria-hidden="true"
      :options="{
        colors: ['#0a1a20', '#0d3b4a', '#1a5c6b', '#0f2e3d'],
        seed: 42,
        animationSpeed: 0.4,
        frequency: { x: 0.00008, y: 0.00015, delta: 0.00005 },
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
