<script setup lang="ts">
const query = groq`*[_type == "siteSettings"][0]{ contactEmail, contactPhone, contactTagline, socialLinks }`
const { data: settings } = await useSanityQuery(query)

const sectionRef = ref<HTMLElement | null>(null)
useScrollReveal(sectionRef)

const platformLabels: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  soundcloud: 'SoundCloud',
  tiktok: 'TikTok',
  twitter: 'X / Twitter',
}
</script>

<template>
  <div>
    <PageHeader title="CONTACT" />
    <section class="px-6 pb-24">
      <div ref="sectionRef" class="max-w-2xl mx-auto text-center">
        <p v-if="settings?.contactTagline" class="text-xl text-white/60 mb-16">
          {{ settings.contactTagline }}
        </p>

        <!-- Social links -->
        <div v-if="settings?.socialLinks" class="flex flex-wrap justify-center gap-6 mb-16">
          <a
            v-for="social in settings.socialLinks"
            :key="social.platform"
            :href="social.url"
            target="_blank"
            rel="noopener noreferrer"
            class="font-display text-lg tracking-widest uppercase px-6 py-3 border border-white/10 rounded-lg
                   hover:border-accent hover:text-accent hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]
                   transition-all duration-300"
          >
            {{ platformLabels[social.platform] || social.platform }}
          </a>
        </div>

        <!-- Direct contact -->
        <div class="space-y-4 text-white/60">
          <p v-if="settings?.contactEmail">
            <a :href="`mailto:${settings.contactEmail}`" class="text-lg hover:text-accent transition-colors">
              {{ settings.contactEmail }}
            </a>
          </p>
          <p v-if="settings?.contactPhone">
            <a :href="`tel:${settings.contactPhone}`" class="text-lg hover:text-accent transition-colors">
              {{ settings.contactPhone }}
            </a>
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
