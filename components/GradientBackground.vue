<script setup lang="ts">
import { MeshGradient } from '@mesh-gradient/vue'
</script>

<template>
  <ClientOnly>
    <MeshGradient
      class="gradient-bg"
      aria-hidden="true"
      :options="{
        colors: ['#2E2E2E', '#2E2E2E', '#FF7A90', '#8D9EC6'],
        seed: 17,
        animationSpeed: 0.4,
        frequency: { x: 0.00010, y: 0.00020, delta: 0.00007 },
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
  width: 100%;
  height: 100%;
}
</style>
