<template>
  <div class="gradient-bg" aria-hidden="true">
    <div class="gradient-blob blob-1" />
    <div class="gradient-blob blob-2" />
    <div class="gradient-blob blob-3" />
    <div class="gradient-blob blob-4" />
  </div>
</template>

<style scoped>
.gradient-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.gradient-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(140px);
  will-change: transform;
}

.blob-1 {
  width: 50vw;
  height: 50vw;
  max-width: 800px;
  max-height: 800px;
  background: radial-gradient(circle, rgba(0, 229, 255, 0.3) 0%, transparent 70%);
  top: -15%;
  left: -10%;
  animation: drift-1 25s ease-in-out infinite;
}

.blob-2 {
  width: 45vw;
  height: 45vw;
  max-width: 700px;
  max-height: 700px;
  background: radial-gradient(circle, rgba(255, 0, 128, 0.25) 0%, transparent 70%);
  bottom: -20%;
  right: -10%;
  animation: drift-2 30s ease-in-out infinite;
}

.blob-3 {
  width: 40vw;
  height: 40vw;
  max-width: 600px;
  max-height: 600px;
  background: radial-gradient(circle, rgba(30, 60, 255, 0.2) 0%, transparent 70%);
  top: 30%;
  left: 40%;
  animation: drift-3 28s ease-in-out infinite;
}

.blob-4 {
  width: 35vw;
  height: 35vw;
  max-width: 550px;
  max-height: 550px;
  background: radial-gradient(circle, rgba(120, 40, 255, 0.15) 0%, transparent 70%);
  top: 10%;
  right: 15%;
  animation: drift-4 22s ease-in-out infinite;
}

@keyframes drift-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(10vw, 5vh) scale(1.1); }
  50% { transform: translate(5vw, 12vh) scale(0.95); }
  75% { transform: translate(-3vw, 7vh) scale(1.05); }
}

@keyframes drift-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(-8vw, -6vh) scale(1.15); }
  50% { transform: translate(-4vw, -12vh) scale(0.9); }
  75% { transform: translate(5vw, -4vh) scale(1.1); }
}

@keyframes drift-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(6vw, -8vh) scale(1.1); }
  66% { transform: translate(-7vw, 4vh) scale(0.95); }
}

@keyframes drift-4 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  30% { transform: translate(-5vw, 8vh) scale(1.08); }
  60% { transform: translate(8vw, -3vh) scale(0.92); }
}

@media (prefers-reduced-motion: reduce) {
  .gradient-blob {
    animation: none;
  }
}

/* Smaller blobs on mobile for performance */
@media (max-width: 768px) {
  .gradient-blob {
    filter: blur(100px);
  }
  .blob-3,
  .blob-4 {
    display: none;
  }
}
</style>
