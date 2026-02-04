<template>
  <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
    <div class="glow-spot glow-1" />
    <div class="glow-spot glow-2" />
    <div class="glow-spot glow-3" />
    <div class="glow-spot glow-4" />
    <div class="glow-spot glow-5" />
  </div>
</template>

<style scoped>
.glow-spot {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
}

/* Top-left cyan — large, sweeps across the top */
.glow-1 {
  width: 900px;
  height: 900px;
  top: -300px;
  left: -300px;
  background: rgba(0, 229, 255, 0.04);
  animation: drift1 14s ease-in-out infinite, pulse1 8s ease-in-out infinite;
}

/* Right-side purple — drifts vertically */
.glow-2 {
  width: 700px;
  height: 700px;
  top: 20%;
  right: -200px;
  background: rgba(120, 60, 230, 0.035);
  animation: drift2 18s ease-in-out infinite, pulse2 10s ease-in-out infinite;
}

/* Center-bottom teal — slow wide orbit */
.glow-3 {
  width: 800px;
  height: 800px;
  bottom: -250px;
  left: 25%;
  background: rgba(0, 200, 220, 0.03);
  animation: drift3 16s ease-in-out infinite;
}

/* Mid-left deep blue — drifts diagonally */
.glow-4 {
  width: 500px;
  height: 500px;
  top: 50%;
  left: -100px;
  background: rgba(30, 80, 200, 0.035);
  animation: drift4 20s ease-in-out infinite, pulse1 12s ease-in-out infinite;
}

/* Top-right magenta — small, fast, wide range -->  */
.glow-5 {
  width: 450px;
  height: 450px;
  top: -100px;
  right: 15%;
  background: rgba(180, 50, 200, 0.025);
  animation: drift5 12s ease-in-out infinite, pulse2 7s ease-in-out infinite;
}

/* --- Drift keyframes: wide, looping paths --- */

@keyframes drift1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  20% { transform: translate(180px, 60px) scale(1.08); }
  40% { transform: translate(120px, 160px) scale(0.94); }
  60% { transform: translate(-60px, 200px) scale(1.06); }
  80% { transform: translate(-100px, 80px) scale(0.96); }
}

@keyframes drift2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  15% { transform: translate(-80px, -120px) scale(1.12); }
  35% { transform: translate(-180px, -40px) scale(0.92); }
  55% { transform: translate(-120px, 140px) scale(1.08); }
  75% { transform: translate(-40px, 100px) scale(0.95); }
}

@keyframes drift3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(140px, -100px) scale(1.1); }
  50% { transform: translate(-80px, -180px) scale(0.93); }
  75% { transform: translate(-160px, -60px) scale(1.05); }
}

@keyframes drift4 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  20% { transform: translate(100px, -80px) scale(1.15); }
  45% { transform: translate(200px, 40px) scale(0.9); }
  65% { transform: translate(80px, 120px) scale(1.1); }
  85% { transform: translate(-40px, 60px) scale(0.95); }
}

@keyframes drift5 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  20% { transform: translate(-120px, 80px) scale(1.18); }
  40% { transform: translate(-60px, 180px) scale(0.88); }
  60% { transform: translate(100px, 140px) scale(1.12); }
  80% { transform: translate(160px, 40px) scale(0.92); }
}

/* --- Opacity pulses --- */

@keyframes pulse1 {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes pulse2 {
  0%, 100% { opacity: 1; }
  30% { opacity: 0.6; }
  70% { opacity: 0.4; }
}

@media (prefers-reduced-motion: reduce) {
  .glow-spot {
    animation: none !important;
  }
}
</style>
