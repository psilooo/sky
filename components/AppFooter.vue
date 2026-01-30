<script setup lang="ts">
const query = groq`*[_type == "siteSettings"][0]{ contactEmail, contactPhone, socialLinks }`
const { data: settings } = await useSanityQuery(query)
</script>

<template>
  <footer class="border-t border-white/10 py-12 px-6">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <span class="font-display text-lg tracking-wider text-white/60">SKY EVENTS ASIA</span>
      <div v-if="settings?.socialLinks" class="flex items-center gap-4">
        <a
          v-for="social in settings.socialLinks"
          :key="social.platform"
          :href="social.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-white/60 hover:text-accent transition-colors capitalize"
          :aria-label="social.platform"
        >
          {{ social.platform }}
        </a>
      </div>
      <div class="text-white/40 text-sm">
        <a v-if="settings?.contactEmail" :href="`mailto:${settings.contactEmail}`" class="hover:text-accent transition-colors">
          {{ settings.contactEmail }}
        </a>
      </div>
    </div>
  </footer>
</template>
