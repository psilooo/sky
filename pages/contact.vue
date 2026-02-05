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
const formRef = ref<HTMLElement | null>(null)
useScrollReveal(sectionRef)
useScrollReveal(formRef)

const platformLabels: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  soundcloud: 'SoundCloud',
  tiktok: 'TikTok',
  twitter: 'X / Twitter',
}

// Contact form state
const form = reactive({
  name: '',
  email: '',
  message: '',
})

const status = ref<'idle' | 'sending' | 'success' | 'error'>('idle')
const errorMessage = ref('')

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function handleSubmit() {
  // Client-side validation
  if (!form.name.trim()) {
    status.value = 'error'
    errorMessage.value = 'Please enter your name.'
    return
  }
  if (!form.email.trim() || !validateEmail(form.email)) {
    status.value = 'error'
    errorMessage.value = 'Please enter a valid email address.'
    return
  }
  if (!form.message.trim()) {
    status.value = 'error'
    errorMessage.value = 'Please enter a message.'
    return
  }

  status.value = 'sending'
  errorMessage.value = ''

  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      },
    })
    status.value = 'success'
    form.name = ''
    form.email = ''
    form.message = ''
  } catch (e: any) {
    status.value = 'error'
    errorMessage.value = e?.data?.statusMessage || 'Something went wrong. Please try again.'
  }
}

function resetForm() {
  status.value = 'idle'
  errorMessage.value = ''
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
            v-for="social in settings.socialLinks.filter((s: any) => s.platform !== 'instagram')"
            :key="social.platform"
            :href="social.url"
            target="_blank"
            rel="noopener noreferrer"
            class="font-display text-lg tracking-widest uppercase px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg
                   hover:border-accent hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]
                   transition-all duration-300"
          >
            {{ platformLabels[social.platform] || social.platform }}
          </a>
        </div>

      </div>

      <!-- Contact Form -->
      <div ref="formRef" class="max-w-xl mx-auto mt-8">
        <!-- Success state -->
        <div v-if="status === 'success'" class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
          <p class="text-xl font-display tracking-wide text-accent mb-4">MESSAGE SENT</p>
          <p class="text-white/60 mb-6">Thanks for reaching out. We'll get back to you soon.</p>
          <button
            @click="resetForm"
            class="font-display text-sm tracking-widest uppercase px-6 py-3 border border-white/10 rounded-lg
                   hover:border-accent hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]
                   transition-all duration-300"
          >
            Send Another Message
          </button>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="handleSubmit" class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 space-y-6">
          <div>
            <label for="name" class="block text-sm font-display tracking-widest uppercase text-white/40 mb-2">Name</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              autocomplete="name"
              class="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 text-white
                     focus:outline-none focus:border-accent focus:shadow-[0_0_12px_rgba(0,229,255,0.15)]
                     transition-all duration-300 placeholder-white/20"
              placeholder="Your name"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-display tracking-widest uppercase text-white/40 mb-2">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              class="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 text-white
                     focus:outline-none focus:border-accent focus:shadow-[0_0_12px_rgba(0,229,255,0.15)]
                     transition-all duration-300 placeholder-white/20"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label for="message" class="block text-sm font-display tracking-widest uppercase text-white/40 mb-2">Message</label>
            <textarea
              id="message"
              v-model="form.message"
              rows="5"
              class="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 text-white resize-none
                     focus:outline-none focus:border-accent focus:shadow-[0_0_12px_rgba(0,229,255,0.15)]
                     transition-all duration-300 placeholder-white/20"
              placeholder="What's on your mind?"
            />
          </div>

          <!-- Error message -->
          <p v-if="status === 'error'" class="text-red-400 text-sm">
            {{ errorMessage }}
          </p>

          <button
            type="submit"
            :disabled="status === 'sending'"
            class="w-full font-display text-lg tracking-widest uppercase py-4 rounded-lg
                   bg-accent text-dark font-bold
                   hover:shadow-[0_0_24px_rgba(0,229,255,0.3)]
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-300"
          >
            {{ status === 'sending' ? 'SENDING...' : 'SEND MESSAGE' }}
          </button>
        </form>
      </div>
    </section>
  </div>
</template>
