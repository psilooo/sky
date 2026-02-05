<template>
  <div class="min-h-screen text-white relative">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-dark focus:rounded-lg focus:font-display focus:text-sm focus:tracking-widest focus:uppercase"
    >
      Skip to content
    </a>
    <GradientBackground />
    <div class="relative z-10">
      <AppNavbar />
      <main id="main-content">
        <slot />
      </main>
      <AppFooter />
    </div>
  </div>
</template>
