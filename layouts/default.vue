<template>
  <div class="min-h-screen bg-dark text-white">
    <BackgroundEffects />
    <AppNavbar />
    <main class="relative z-10">
      <slot />
    </main>
    <AppFooter class="relative z-10" />
  </div>
</template>
