<script setup lang="ts">
const mouseX = ref(0)
const mouseY = ref(0)
const mouseActive = ref(false)

const mouseGlowStyle = computed(() => ({
  background: 'radial-gradient(600px circle at center, rgba(0, 229, 255, 0.06), transparent 70%)',
  transform: `translate(${mouseX.value - 300}px, ${mouseY.value - 300}px)`,
  opacity: mouseActive.value ? 1 : 0,
  width: '600px',
  height: '600px',
}))

onMounted(() => {
  let ticking = false

  const onMove = (e: MouseEvent) => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      mouseX.value = e.clientX
      mouseY.value = e.clientY
      mouseActive.value = true
      ticking = false
    })
  }

  const onLeave = () => {
    mouseActive.value = false
  }

  window.addEventListener('mousemove', onMove, { passive: true })
  document.documentElement.addEventListener('mouseleave', onLeave)

  onUnmounted(() => {
    window.removeEventListener('mousemove', onMove)
    document.documentElement.removeEventListener('mouseleave', onLeave)
  })
})
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
    <!-- Ambient glow spots with slow drift animations -->
    <div class="glow-spot glow-1" />
    <div class="glow-spot glow-2" />
    <div class="glow-spot glow-3" />

    <!-- Mouse-reactive glow -->
    <div
      class="fixed top-0 left-0 rounded-full transition-opacity duration-500"
      :style="mouseGlowStyle"
    />
  </div>
</template>

<style scoped>
.glow-spot {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
}

.glow-1 {
  width: 800px;
  height: 800px;
  top: -200px;
  left: -200px;
  background: rgba(0, 229, 255, 0.035);
  animation: drift1 25s ease-in-out infinite;
}

.glow-2 {
  width: 600px;
  height: 600px;
  top: 40%;
  right: -150px;
  background: rgba(120, 80, 220, 0.03);
  animation: drift2 30s ease-in-out infinite;
}

.glow-3 {
  width: 700px;
  height: 700px;
  bottom: -200px;
  left: 30%;
  background: rgba(0, 229, 255, 0.025);
  animation: drift3 35s ease-in-out infinite;
}

@keyframes drift1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(60px, 40px) scale(1.05); }
  50% { transform: translate(30px, 80px) scale(0.95); }
  75% { transform: translate(-20px, 40px) scale(1.02); }
}

@keyframes drift2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(-40px, -30px) scale(1.1); }
  50% { transform: translate(-80px, 20px) scale(0.95); }
  75% { transform: translate(-30px, -50px) scale(1.05); }
}

@keyframes drift3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(50px, -30px) scale(1.08); }
  50% { transform: translate(-30px, -60px) scale(0.97); }
  75% { transform: translate(20px, -20px) scale(1.03); }
}

@media (prefers-reduced-motion: reduce) {
  .glow-spot {
    animation: none !important;
  }
}
</style>
