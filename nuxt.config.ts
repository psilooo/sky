// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/google-fonts'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    resendApiKey: '',
    public: {
      sanity: {
        projectId: 'glybi1mo',
        dataset: 'production',
        apiVersion: '2025-01-30',
      },
    },
  },
  googleFonts: {
    display: 'swap',
    families: {
      'Anton': true,
      'Bebas Neue': true,
      'Space Grotesk': [300, 400, 500, 600, 700],
    },
  },
  nitro: {
    prerender: {
      routes: ['/', '/events', '/about', '/media', '/contact'],
    },
  },
  app: {
    head: {
      title: 'SKY Events Asia',
      meta: [
        { name: 'description', content: 'Electronic music festival production company in Asia' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },
})
