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
          v-for="social in settings.socialLinks.filter((s: any) => s.platform !== 'instagram')"
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
      <div class="flex items-center gap-4">
        <a v-if="settings?.contactEmail" :href="`mailto:${settings.contactEmail}`" class="text-white/40 text-sm hover:text-accent transition-colors">
          {{ settings.contactEmail }}
        </a>
        <a
          href="https://www.instagram.com/skyeventsasia/"
          target="_blank"
          rel="noopener noreferrer"
          class="font-display tracking-widest uppercase text-sm px-4 py-2 border border-accent/40 rounded-lg
                 text-accent hover:bg-accent/10 hover:shadow-[0_0_16px_rgba(0,229,255,0.15)]
                 transition-all duration-300"
          aria-label="Instagram"
        >
          Instagram
        </a>
      </div>
    </div>
  </footer>
</template>
