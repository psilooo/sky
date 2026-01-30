// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/sanity', '@nuxtjs/google-fonts'],
  css: ['~/assets/css/main.css'],
  sanity: {
    projectId: 'glybi1mo',
    dataset: 'production',
    apiVersion: '2025-01-30',
  },
  googleFonts: {
    families: {
      'Bebas Neue': true,
      'Space Grotesk': [300, 400, 500, 600, 700],
    },
  },
  nitro: {
    prerender: {
      routes: ['/', '/events', '/about', '/media', '/contact'],
    },
  },
  vite: {
    server: {
      watch: {
        ignored: ['**/sanity/**'],
      },
    },
  },
  app: {
    head: {
      title: 'SKY Events Asia',
      meta: [
        { name: 'description', content: 'Electronic music festival production company in Asia' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },
})
