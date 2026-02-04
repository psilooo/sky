<script setup lang="ts">
import { MeshGradient } from '@mesh-gradient/vue'
</script>

<template>
  <ClientOnly>
    <MeshGradient
      class="gradient-bg"
      aria-hidden="true"
      :options="{
        colors: ['#474747', '#AAE7EE', '#121212', '#FF779B'],
        seed: 42,
        animationSpeed: 0.4,
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
