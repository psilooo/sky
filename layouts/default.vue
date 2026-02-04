<template>
  <div class="min-h-screen text-white relative">
    <GradientBackground />
    <div class="relative z-10">
      <AppNavbar />
      <main>
        <slot />
      </main>
      <AppFooter />
    </div>
  </div>
</template>
