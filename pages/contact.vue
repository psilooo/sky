<script setup lang="ts">
useSeoMeta({
  title: 'Contact | SKY Events Asia',
  ogTitle: 'Contact | SKY Events Asia',
  description: 'Get in touch with SKY Events Asia. Follow us on social media or reach out directly.',
  ogDescription: 'Get in touch with SKY Events Asia. Follow us on social media or reach out directly.',
})

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
            class="font-display text-lg tracking-widest uppercase px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg
                   hover:border-accent hover:text-accent hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]
                   transition-all duration-300"
          >
            {{ platformLabels[social.platform] || social.platform }}
          </a>
        </div>

      </div>
    </section>
  </div>
</template>
