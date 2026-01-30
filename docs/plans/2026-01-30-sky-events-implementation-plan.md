# SKY Events Asia Website — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a dark, immersive, motion-rich marketing website for SKY Events Asia, an electronic music festival production company.

**Architecture:** Nuxt 3 with file-based routing and static site generation. Sanity headless CMS for all dynamic content (events, team, media, social links). GSAP for scroll-triggered animations and page transitions. Tailwind CSS for styling.

**Tech Stack:** Nuxt 3, Vue 3, Tailwind CSS, GSAP + ScrollTrigger, Sanity v3, @nuxtjs/sanity, @sanity/image-url

---

### Task 1: Scaffold Nuxt 3 Project

**Files:**
- Create: `nuxt.config.ts`
- Create: `app.vue`
- Create: `package.json` (via npx)
- Create: `tailwind.config.ts`
- Create: `.gitignore`

**Step 1: Initialize Nuxt project**

Run from `/Users/sam/Desktop/SKY`:

```bash
npx nuxi@latest init sky-app --package-manager npm
```

Move contents out of the `sky-app` subdirectory into the project root (or init directly — adjust as needed).

**Step 2: Install core dependencies**

```bash
npm install gsap @sanity/client @sanity/image-url
npx nuxi@latest module add sanity
npm install -D @nuxtjs/tailwindcss @nuxtjs/google-fonts
```

**Step 3: Configure nuxt.config.ts**

```typescript
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/sanity', '@nuxtjs/google-fonts'],
  css: ['~/assets/css/main.css'],
  sanity: {
    projectId: 'YOUR_PROJECT_ID',
    dataset: 'production',
    apiVersion: '2025-01-30',
  },
  googleFonts: {
    families: {
      'Bebas Neue': true,
      'Space Grotesk': [300, 400, 500, 600, 700],
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
```

**Step 4: Configure Tailwind**

Create `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: [],
  theme: {
    extend: {
      colors: {
        dark: '#0a0a0a',
        'dark-lighter': '#111111',
        'dark-card': '#161616',
        accent: '#00e5ff',
        'accent-glow': 'rgba(0, 229, 255, 0.3)',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"Space Grotesk"', 'sans-serif'],
      },
    },
  },
} satisfies Config
```

**Step 5: Create base CSS**

Create `assets/css/main.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-dark text-white font-body;
}

::selection {
  @apply bg-accent text-dark;
}

/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
```

**Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: Dev server at http://localhost:3000 with no errors.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Nuxt 3 project with Tailwind, GSAP, Sanity deps"
```

---

### Task 2: Set Up Sanity Studio & Schemas

**Files:**
- Create: `sanity/` directory (via CLI)
- Create: `sanity/schemaTypes/event.ts`
- Create: `sanity/schemaTypes/teamMember.ts`
- Create: `sanity/schemaTypes/mediaItem.ts`
- Create: `sanity/schemaTypes/siteSettings.ts`
- Create: `sanity/schemaTypes/socialLink.ts`

**Step 1: Initialize Sanity project**

```bash
npm create sanity@latest -- --project-id <ID> --dataset production --output-path sanity
```

Follow prompts: choose "Clean project with no predefined schema types".

**Step 2: Create Event schema**

Create `sanity/schemaTypes/event.ts`:

```typescript
import { defineType, defineField } from 'sanity'

export const event = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'date', title: 'Date', type: 'datetime', validation: (r) => r.required() }),
    defineField({ name: 'venue', title: 'Venue', type: 'string' }),
    defineField({ name: 'location', title: 'Location', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'featuredImage', title: 'Featured Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'gallery', title: 'Gallery', type: 'array', of: [{ type: 'image', options: { hotspot: true } }] }),
    defineField({ name: 'videoUrl', title: 'Video URL', type: 'url' }),
    defineField({ name: 'lineup', title: 'Lineup', type: 'array', of: [{ type: 'string' }] }),
  ],
  orderings: [{ title: 'Date (Newest)', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] }],
  preview: {
    select: { title: 'title', subtitle: 'venue', media: 'featuredImage' },
  },
})
```

**Step 3: Create Team Member schema**

Create `sanity/schemaTypes/teamMember.ts`:

```typescript
import { defineType, defineField } from 'sanity'

export const teamMember = defineType({
  name: 'teamMember',
  title: 'Team Member',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'role', title: 'Role', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'bio', title: 'Bio', type: 'text' }),
    defineField({ name: 'photo', title: 'Photo', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'order', title: 'Display Order', type: 'number' }),
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'photo' },
  },
})
```

**Step 4: Create Media Item schema**

Create `sanity/schemaTypes/mediaItem.ts`:

```typescript
import { defineType, defineField } from 'sanity'

export const mediaItem = defineType({
  name: 'mediaItem',
  title: 'Media Item',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({
      name: 'mediaType',
      title: 'Type',
      type: 'string',
      options: { list: [{ title: 'Photo', value: 'photo' }, { title: 'Video', value: 'video' }] },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true }, hidden: ({ parent }) => parent?.mediaType === 'video' }),
    defineField({ name: 'videoUrl', title: 'Video URL', type: 'url', hidden: ({ parent }) => parent?.mediaType === 'photo' }),
    defineField({ name: 'videoThumbnail', title: 'Video Thumbnail', type: 'image', hidden: ({ parent }) => parent?.mediaType === 'photo' }),
    defineField({ name: 'event', title: 'Event', type: 'reference', to: [{ type: 'event' }] }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({ name: 'featured', title: 'Featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'uploadDate', title: 'Upload Date', type: 'datetime' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'mediaType', media: 'image' },
  },
})
```

**Step 5: Create Site Settings schema (for about text, contact info, social links)**

Create `sanity/schemaTypes/siteSettings.ts`:

```typescript
import { defineType, defineField } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'heroTagline', title: 'Hero Tagline', type: 'string' }),
    defineField({ name: 'heroVideoUrl', title: 'Hero Video URL', type: 'url' }),
    defineField({ name: 'heroFallbackImage', title: 'Hero Fallback Image', type: 'image' }),
    defineField({ name: 'aboutTeaser', title: 'About Teaser (one-liner)', type: 'string' }),
    defineField({ name: 'aboutStory', title: 'About Story', type: 'array', of: [{ type: 'block' }, { type: 'image', options: { hotspot: true } }] }),
    defineField({ name: 'aboutHeroImage', title: 'About Hero Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'aboutTagline', title: 'About Tagline', type: 'string' }),
    defineField({ name: 'contactEmail', title: 'Contact Email', type: 'string' }),
    defineField({ name: 'contactPhone', title: 'Contact Phone', type: 'string' }),
    defineField({ name: 'contactTagline', title: 'Contact Tagline', type: 'string' }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'platform', title: 'Platform', type: 'string', options: { list: ['instagram', 'facebook', 'youtube', 'soundcloud', 'tiktok', 'twitter'] } }),
          defineField({ name: 'url', title: 'URL', type: 'url' }),
        ],
        preview: { select: { title: 'platform', subtitle: 'url' } },
      }],
    }),
  ],
})
```

**Step 6: Register all schemas**

Update `sanity/schemaTypes/index.ts`:

```typescript
import { event } from './event'
import { teamMember } from './teamMember'
import { mediaItem } from './mediaItem'
import { siteSettings } from './siteSettings'

export const schemaTypes = [event, teamMember, mediaItem, siteSettings]
```

**Step 7: Verify Sanity Studio launches**

```bash
cd sanity && npx sanity dev
```

Expected: Studio at http://localhost:3333 showing Event, Team Member, Media Item, Site Settings document types.

**Step 8: Add seed content in Sanity Studio**

Manually add:
- 1 Site Settings document (fill in tagline, email, phone, 2-3 social links)
- 2-3 sample events (1 upcoming, 2 past with images)
- 2-3 team members
- 5-6 media items (mix of photos and videos)

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: add Sanity studio with event, team, media, settings schemas"
```

---

### Task 3: Create Layout, Navigation & Footer

**Files:**
- Create: `layouts/default.vue`
- Create: `components/AppNavbar.vue`
- Create: `components/AppFooter.vue`
- Create: `components/MobileMenu.vue`
- Modify: `app.vue`

**Step 1: Create app.vue**

```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

**Step 2: Create default layout**

Create `layouts/default.vue`:

```vue
<template>
  <div class="min-h-screen bg-dark text-white">
    <AppNavbar />
    <main>
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
```

**Step 3: Create AppNavbar component**

Create `components/AppNavbar.vue`:

```vue
<script setup lang="ts">
const route = useRoute()
const scrolled = ref(false)
const mobileMenuOpen = ref(false)

const links = [
  { label: 'Events', to: '/events' },
  { label: 'About', to: '/about' },
  { label: 'Media', to: '/media' },
  { label: 'Contact', to: '/contact' },
]

function onScroll() {
  scrolled.value = window.scrollY > 50
}

onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

watch(() => route.path, () => { mobileMenuOpen.value = false })
</script>

<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4"
    :class="scrolled ? 'bg-dark/95 backdrop-blur-sm' : 'bg-transparent'"
  >
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <NuxtLink to="/" class="font-display text-2xl tracking-wider text-white hover:text-accent transition-colors">
        SKY EVENTS ASIA
      </NuxtLink>
      <!-- Desktop links -->
      <div class="hidden md:flex items-center gap-8">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="font-display text-sm tracking-widest uppercase transition-colors hover:text-accent"
          :class="route.path === link.to ? 'text-accent' : 'text-white/80'"
        >
          {{ link.label }}
        </NuxtLink>
      </div>
      <!-- Mobile hamburger -->
      <button
        class="md:hidden text-white"
        @click="mobileMenuOpen = !mobileMenuOpen"
        aria-label="Toggle menu"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </nav>
  <MobileMenu :open="mobileMenuOpen" :links="links" @close="mobileMenuOpen = false" />
</template>
```

**Step 4: Create MobileMenu component**

Create `components/MobileMenu.vue`:

```vue
<script setup lang="ts">
defineProps<{ open: boolean; links: { label: string; to: string }[] }>()
defineEmits<{ close: [] }>()
const route = useRoute()
</script>

<template>
  <Transition name="menu">
    <div v-if="open" class="fixed inset-0 z-40 bg-dark flex flex-col items-center justify-center gap-8">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="font-display text-4xl tracking-widest uppercase transition-colors hover:text-accent"
        :class="route.path === link.to ? 'text-accent' : 'text-white'"
        @click="$emit('close')"
      >
        {{ link.label }}
      </NuxtLink>
    </div>
  </Transition>
</template>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.3s ease;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}
</style>
```

**Step 5: Create AppFooter component**

Create `components/AppFooter.vue`:

```vue
<script setup lang="ts">
const query = groq`*[_type == "siteSettings"][0]{ contactEmail, contactPhone, socialLinks }`
const { data: settings } = await useSanityQuery(query)

const iconMap: Record<string, string> = {
  instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07...',  // SVG paths — use actual icon library
  facebook: '...',
  youtube: '...',
  soundcloud: '...',
  tiktok: '...',
  twitter: '...',
}
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
          class="text-white/60 hover:text-accent transition-colors"
          :aria-label="social.platform"
        >
          {{ social.platform }}
        </a>
      </div>
      <div class="text-white/40 text-sm">
        <a v-if="settings?.contactEmail" :href="`mailto:${settings.contactEmail}`" class="hover:text-accent transition-colors">{{ settings.contactEmail }}</a>
      </div>
    </div>
  </footer>
</template>
```

Note: Use an icon library like `nuxt-icon` or inline SVGs for social icons. The exact icon approach will be decided during implementation.

**Step 6: Verify layout renders**

Create a temporary `pages/index.vue`:

```vue
<template>
  <div class="pt-24 px-6">
    <h1 class="font-display text-6xl">SKY EVENTS ASIA</h1>
    <p class="mt-4 text-white/60">Site under construction</p>
  </div>
</template>
```

Run `npm run dev` and verify: navbar, footer, dark background, fonts loading.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add default layout with navbar, mobile menu, and footer"
```

---

### Task 4: Build GSAP Composable & Animation Utilities

**Files:**
- Create: `composables/useGsap.ts`
- Create: `plugins/gsap.client.ts`

**Step 1: Create GSAP client plugin**

Create `plugins/gsap.client.ts` (`.client` ensures it only runs in browser):

```typescript
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default defineNuxtPlugin(() => {
  gsap.registerPlugin(ScrollTrigger)
  return { provide: { gsap, ScrollTrigger } }
})
```

**Step 2: Create useGsap composable**

Create `composables/useGsap.ts`:

```typescript
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function useScrollReveal(el: Ref<HTMLElement | null>, options?: gsap.TweenVars) {
  onMounted(() => {
    if (!el.value) return
    gsap.from(el.value, {
      y: 60,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el.value, start: 'top 85%', toggleActions: 'play none none none' },
      ...options,
    })
  })
}

export function useStaggerReveal(container: Ref<HTMLElement | null>, childSelector: string, options?: gsap.TweenVars) {
  onMounted(() => {
    if (!container.value) return
    const children = container.value.querySelectorAll(childSelector)
    gsap.from(children, {
      y: 60,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: { trigger: container.value, start: 'top 85%', toggleActions: 'play none none none' },
      ...options,
    })
  })
}

export function useTextReveal(el: Ref<HTMLElement | null>) {
  onMounted(() => {
    if (!el.value) return
    gsap.from(el.value, {
      clipPath: 'inset(0 100% 0 0)',
      duration: 1.2,
      ease: 'power4.inOut',
      scrollTrigger: { trigger: el.value, start: 'top 85%', toggleActions: 'play none none none' },
    })
  })
}
```

**Step 3: Verify GSAP loads without SSR errors**

Run `npm run dev`, check browser console for errors. GSAP should only initialize client-side.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add GSAP plugin and scroll animation composables"
```

---

### Task 5: Build Sanity Helper Composable

**Files:**
- Create: `composables/useSanityImage.ts`

**Step 1: Create image URL helper**

Create `composables/useSanityImage.ts`:

```typescript
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

export function useSanityImageUrl() {
  const { projectId, dataset } = useSanity().client.config()

  function urlFor(source: SanityImageSource) {
    return imageUrlBuilder({ projectId: projectId!, dataset: dataset! }).image(source)
  }

  return { urlFor }
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Sanity image URL helper composable"
```

---

### Task 6: Build Home Page

**Files:**
- Modify: `pages/index.vue`
- Create: `components/HeroSection.vue`
- Create: `components/EventsTeaser.vue`
- Create: `components/AboutTeaser.vue`
- Create: `components/MediaHighlight.vue`

**Step 1: Create HeroSection component**

Create `components/HeroSection.vue`:

```vue
<script setup lang="ts">
import { gsap } from 'gsap'

const query = groq`*[_type == "siteSettings"][0]{ heroTagline, heroVideoUrl, heroFallbackImage }`
const { data: settings } = await useSanityQuery(query)
const { urlFor } = useSanityImageUrl()

const heroRef = ref<HTMLElement | null>(null)
const taglineRef = ref<HTMLElement | null>(null)
const scrollIndicator = ref<HTMLElement | null>(null)

onMounted(() => {
  if (taglineRef.value) {
    gsap.from(taglineRef.value, { opacity: 0, y: 30, duration: 1.5, delay: 0.5, ease: 'power3.out' })
  }
  if (scrollIndicator.value) {
    gsap.to(scrollIndicator.value, { y: 10, repeat: -1, yoyo: true, duration: 1.5, ease: 'power1.inOut' })
  }
  if (heroRef.value) {
    gsap.to(heroRef.value, {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: { trigger: heroRef.value, start: 'top top', end: 'bottom top', scrub: true },
    })
  }
})
</script>

<template>
  <section class="relative h-screen overflow-hidden flex items-center justify-center">
    <!-- Video background -->
    <div ref="heroRef" class="absolute inset-0">
      <video
        v-if="settings?.heroVideoUrl"
        :src="settings.heroVideoUrl"
        autoplay
        loop
        muted
        playsinline
        class="w-full h-full object-cover"
      />
      <img
        v-else-if="settings?.heroFallbackImage"
        :src="urlFor(settings.heroFallbackImage).width(1920).url()"
        alt=""
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-dark/60" />
    </div>
    <!-- Content -->
    <div class="relative z-10 text-center">
      <h1 class="font-display text-6xl md:text-8xl lg:text-9xl tracking-wider">
        SKY EVENTS ASIA
      </h1>
      <p v-if="settings?.heroTagline" ref="taglineRef" class="mt-6 text-lg md:text-xl text-white/70 tracking-wide">
        {{ settings.heroTagline }}
      </p>
    </div>
    <!-- Scroll indicator -->
    <div ref="scrollIndicator" class="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7" />
      </svg>
    </div>
  </section>
</template>
```

**Step 2: Create EventsTeaser component**

Create `components/EventsTeaser.vue`:

```vue
<script setup lang="ts">
const query = groq`*[_type == "event" && date > now()] | order(date asc) [0..2] { _id, title, date, venue, featuredImage }`
const { data: events } = await useSanityQuery(query)
const { urlFor } = useSanityImageUrl()

const containerRef = ref<HTMLElement | null>(null)
useStaggerReveal(containerRef, '.event-card')
</script>

<template>
  <section v-if="events?.length" class="py-24 px-6">
    <div class="max-w-7xl mx-auto">
      <h2 class="font-display text-4xl md:text-5xl tracking-wider mb-12">UPCOMING EVENTS</h2>
      <div ref="containerRef" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="event in events"
          :key="event._id"
          to="/events"
          class="event-card group relative overflow-hidden rounded-lg aspect-[4/3] cursor-pointer"
        >
          <img
            v-if="event.featuredImage"
            :src="urlFor(event.featuredImage).width(600).height(450).url()"
            :alt="event.title"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
          <div class="absolute bottom-0 left-0 right-0 p-6">
            <h3 class="font-display text-2xl tracking-wider">{{ event.title }}</h3>
            <p class="text-white/60 mt-1">{{ new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}</p>
            <p v-if="event.venue" class="text-accent text-sm mt-1">{{ event.venue }}</p>
          </div>
          <div class="absolute inset-0 border border-transparent group-hover:border-accent/30 group-hover:shadow-[0_0_30px_rgba(0,229,255,0.1)] rounded-lg transition-all duration-300" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
```

**Step 3: Create AboutTeaser component**

Create `components/AboutTeaser.vue`:

```vue
<script setup lang="ts">
const query = groq`*[_type == "siteSettings"][0]{ aboutTeaser }`
const { data: settings } = await useSanityQuery(query)

const sectionRef = ref<HTMLElement | null>(null)
useScrollReveal(sectionRef)
</script>

<template>
  <section class="py-24 px-6 bg-dark-lighter">
    <div ref="sectionRef" class="max-w-4xl mx-auto text-center">
      <p class="text-xl md:text-2xl text-white/70 leading-relaxed">
        {{ settings?.aboutTeaser || 'Bringing underground electronic music to Asia.' }}
      </p>
      <NuxtLink to="/about" class="inline-block mt-8 font-display text-sm tracking-widest uppercase text-accent hover:text-white transition-colors">
        Learn More →
      </NuxtLink>
    </div>
  </section>
</template>
```

**Step 4: Create MediaHighlight component**

Create `components/MediaHighlight.vue`:

```vue
<script setup lang="ts">
const query = groq`*[_type == "mediaItem" && featured == true] | order(uploadDate desc) [0..4] {
  _id, title, mediaType, image, videoUrl, videoThumbnail, caption,
  "eventTitle": event->title
}`
const { data: items } = await useSanityQuery(query)
const { urlFor } = useSanityImageUrl()

const containerRef = ref<HTMLElement | null>(null)
useStaggerReveal(containerRef, '.media-item')
</script>

<template>
  <section v-if="items?.length" class="py-24 px-6">
    <div class="max-w-7xl mx-auto">
      <h2 class="font-display text-4xl md:text-5xl tracking-wider mb-12">MEDIA</h2>
      <div ref="containerRef" class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <NuxtLink
          v-for="(item, i) in items"
          :key="item._id"
          to="/media"
          class="media-item relative overflow-hidden rounded-lg group"
          :class="i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-[4/3]'"
        >
          <img
            :src="urlFor(item.mediaType === 'photo' ? item.image : item.videoThumbnail).width(800).url()"
            :alt="item.caption || item.title"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div class="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span v-if="item.mediaType === 'video'" class="text-4xl">▶</span>
          </div>
        </NuxtLink>
      </div>
      <div class="text-center mt-8">
        <NuxtLink to="/media" class="font-display text-sm tracking-widest uppercase text-accent hover:text-white transition-colors">
          View All →
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
```

**Step 5: Assemble Home page**

Update `pages/index.vue`:

```vue
<template>
  <div>
    <HeroSection />
    <EventsTeaser />
    <AboutTeaser />
    <MediaHighlight />
  </div>
</template>
```

**Step 6: Verify home page renders with Sanity data**

Run `npm run dev`. Check all sections render, animations trigger on scroll.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: build home page with hero, events teaser, about teaser, media highlight"
```

---

### Task 7: Build Events Page

**Files:**
- Create: `pages/events.vue`
- Create: `components/EventCard.vue`
- Create: `components/PageHeader.vue`

**Step 1: Create reusable PageHeader component**

Create `components/PageHeader.vue`:

```vue
<script setup lang="ts">
defineProps<{ title: string }>()
const titleRef = ref<HTMLElement | null>(null)
useTextReveal(titleRef)
</script>

<template>
  <div class="pt-32 pb-12 px-6">
    <div class="max-w-7xl mx-auto">
      <h1 ref="titleRef" class="font-display text-6xl md:text-8xl tracking-wider">
        {{ title }}
      </h1>
    </div>
  </div>
</template>
```

**Step 2: Create EventCard component**

Create `components/EventCard.vue`:

```vue
<script setup lang="ts">
import { gsap } from 'gsap'
import type { SanityDocument } from '@sanity/client'

const props = defineProps<{ event: SanityDocument; expanded: boolean }>()
const emit = defineEmits<{ toggle: [id: string] }>()
const { urlFor } = useSanityImageUrl()
const contentRef = ref<HTMLElement | null>(null)

watch(() => props.expanded, (val) => {
  if (!contentRef.value) return
  if (val) {
    gsap.fromTo(contentRef.value, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.5, ease: 'power2.out' })
  } else {
    gsap.to(contentRef.value, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.in' })
  }
})
</script>

<template>
  <div
    class="group relative overflow-hidden rounded-lg border border-white/5 hover:border-accent/30 transition-all duration-300"
    :class="expanded ? 'border-accent/30 shadow-[0_0_40px_rgba(0,229,255,0.08)]' : ''"
  >
    <!-- Card header (always visible) -->
    <button class="w-full text-left" @click="emit('toggle', event._id)">
      <div class="relative h-48 md:h-56 overflow-hidden">
        <img
          v-if="event.featuredImage"
          :src="urlFor(event.featuredImage).width(1200).height(400).url()"
          :alt="event.title"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-transparent" />
        <div class="absolute bottom-0 left-0 right-0 p-6">
          <h3 class="font-display text-3xl md:text-4xl tracking-wider">{{ event.title }}</h3>
          <div class="flex items-center gap-4 mt-2 text-white/60">
            <span>{{ new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}</span>
            <span v-if="event.venue" class="text-accent">{{ event.venue }}</span>
            <span v-if="event.location">{{ event.location }}</span>
          </div>
        </div>
      </div>
    </button>

    <!-- Expanded content -->
    <div ref="contentRef" class="h-0 opacity-0 overflow-hidden">
      <div class="p-6 space-y-6">
        <!-- Description -->
        <div v-if="event.description" class="prose prose-invert max-w-none">
          <SanityContent :blocks="event.description" />
        </div>

        <!-- Lineup -->
        <div v-if="event.lineup?.length">
          <h4 class="font-display text-xl tracking-wider mb-3">LINEUP</h4>
          <div class="flex flex-wrap gap-2">
            <span v-for="artist in event.lineup" :key="artist" class="px-3 py-1 bg-white/5 rounded-full text-sm text-white/80">
              {{ artist }}
            </span>
          </div>
        </div>

        <!-- Gallery -->
        <div v-if="event.gallery?.length">
          <h4 class="font-display text-xl tracking-wider mb-3">GALLERY</h4>
          <div class="grid grid-cols-3 md:grid-cols-4 gap-2">
            <img
              v-for="(img, i) in event.gallery"
              :key="i"
              :src="urlFor(img).width(300).height(200).url()"
              :alt="`${event.title} gallery ${i + 1}`"
              class="w-full aspect-[3/2] object-cover rounded"
            />
          </div>
        </div>

        <!-- Video -->
        <div v-if="event.videoUrl">
          <h4 class="font-display text-xl tracking-wider mb-3">RECAP</h4>
          <div class="aspect-video rounded overflow-hidden">
            <iframe :src="event.videoUrl" class="w-full h-full" allowfullscreen />
          </div>
        </div>

        <!-- Close button -->
        <button
          class="font-display text-sm tracking-widest uppercase text-white/40 hover:text-accent transition-colors"
          @click="emit('toggle', event._id)"
        >
          Close ✕
        </button>
      </div>
    </div>
  </div>
</template>
```

**Step 3: Create Events page**

Create `pages/events.vue`:

```vue
<script setup lang="ts">
const query = groq`*[_type == "event"] | order(date desc) {
  _id, title, date, venue, location, description, featuredImage, gallery, videoUrl, lineup
}`
const { data: events } = await useSanityQuery(query)

const activeTab = ref<'upcoming' | 'past'>('upcoming')
const expandedId = ref<string | null>(null)

const now = new Date().toISOString()
const upcomingEvents = computed(() => events.value?.filter((e: any) => e.date > now) || [])
const pastEvents = computed(() => events.value?.filter((e: any) => e.date <= now) || [])
const displayedEvents = computed(() => activeTab.value === 'upcoming' ? upcomingEvents.value : pastEvents.value)

function toggleEvent(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

const listRef = ref<HTMLElement | null>(null)
useStaggerReveal(listRef, '.event-item')
</script>

<template>
  <div>
    <PageHeader title="EVENTS" />
    <section class="px-6 pb-24">
      <div class="max-w-5xl mx-auto">
        <!-- Tabs -->
        <div class="flex gap-4 mb-12">
          <button
            v-for="tab in (['upcoming', 'past'] as const)"
            :key="tab"
            class="font-display text-sm tracking-widest uppercase px-4 py-2 rounded transition-colors"
            :class="activeTab === tab ? 'bg-accent text-dark' : 'text-white/60 hover:text-white'"
            @click="activeTab = tab; expandedId = null"
          >
            {{ tab }}
          </button>
        </div>

        <!-- Events list -->
        <div ref="listRef" class="space-y-6">
          <div v-if="displayedEvents.length === 0" class="text-center py-16">
            <p class="text-white/40 text-lg">
              {{ activeTab === 'upcoming' ? 'Stay tuned for upcoming events.' : 'No past events yet.' }}
            </p>
          </div>
          <div v-for="event in displayedEvents" :key="event._id" class="event-item">
            <EventCard :event="event" :expanded="expandedId === event._id" @toggle="toggleEvent" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
```

**Step 4: Verify events page with Sanity data**

Run `npm run dev`, navigate to `/events`. Check tabs, expand/collapse, content from Sanity.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: build events page with expandable detail cards and upcoming/past tabs"
```

---

### Task 8: Build About Page

**Files:**
- Create: `pages/about.vue`
- Create: `components/TeamCard.vue`

**Step 1: Create TeamCard component**

Create `components/TeamCard.vue`:

```vue
<script setup lang="ts">
defineProps<{ member: { name: string; role: string; bio?: string; photo?: any } }>()
const { urlFor } = useSanityImageUrl()
</script>

<template>
  <div class="group text-center">
    <div class="relative overflow-hidden rounded-lg aspect-[3/4] mb-4">
      <img
        v-if="member.photo"
        :src="urlFor(member.photo).width(400).height(533).url()"
        :alt="member.name"
        class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
      />
    </div>
    <h3 class="font-display text-xl tracking-wider">{{ member.name }}</h3>
    <p class="text-accent text-sm mt-1">{{ member.role }}</p>
    <p v-if="member.bio" class="text-white/50 text-sm mt-2 max-w-xs mx-auto">{{ member.bio }}</p>
  </div>
</template>
```

**Step 2: Create About page**

Create `pages/about.vue`:

```vue
<script setup lang="ts">
const settingsQuery = groq`*[_type == "siteSettings"][0]{ aboutStory, aboutHeroImage, aboutTagline }`
const teamQuery = groq`*[_type == "teamMember"] | order(order asc) { _id, name, role, bio, photo }`

const { data: settings } = await useSanityQuery(settingsQuery)
const { data: team } = await useSanityQuery(teamQuery)
const { urlFor } = useSanityImageUrl()

const storyRef = ref<HTMLElement | null>(null)
const teamRef = ref<HTMLElement | null>(null)
useScrollReveal(storyRef)
useStaggerReveal(teamRef, '.team-card')
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative h-[60vh] flex items-center justify-center overflow-hidden">
      <img
        v-if="settings?.aboutHeroImage"
        :src="urlFor(settings.aboutHeroImage).width(1920).url()"
        alt=""
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-dark/70" />
      <div class="relative z-10 text-center">
        <PageHeader title="ABOUT" />
        <p v-if="settings?.aboutTagline" class="text-xl text-white/60 mt-2 px-6">{{ settings.aboutTagline }}</p>
      </div>
    </section>

    <!-- Story -->
    <section class="py-24 px-6">
      <div ref="storyRef" class="max-w-3xl mx-auto prose prose-invert prose-lg">
        <SanityContent v-if="settings?.aboutStory" :blocks="settings.aboutStory" />
      </div>
    </section>

    <!-- Team -->
    <section v-if="team?.length" class="py-24 px-6 bg-dark-lighter">
      <div class="max-w-5xl mx-auto">
        <h2 class="font-display text-4xl md:text-5xl tracking-wider mb-12 text-center">THE TEAM</h2>
        <div ref="teamRef" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <div v-for="member in team" :key="member._id" class="team-card">
            <TeamCard :member="member" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
```

**Step 3: Verify about page**

Run `npm run dev`, navigate to `/about`. Check hero image, story content, team grid.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: build about page with hero, story, and team section"
```

---

### Task 9: Build Media Page

**Files:**
- Create: `pages/media.vue`
- Create: `components/MediaGrid.vue`
- Create: `components/MediaLightbox.vue`

**Step 1: Create MediaLightbox component**

Create `components/MediaLightbox.vue`:

```vue
<script setup lang="ts">
const props = defineProps<{
  items: any[]
  currentIndex: number
  open: boolean
}>()
const emit = defineEmits<{ close: []; navigate: [index: number] }>()
const { urlFor } = useSanityImageUrl()

const current = computed(() => props.items[props.currentIndex])

function next() { emit('navigate', (props.currentIndex + 1) % props.items.length) }
function prev() { emit('navigate', (props.currentIndex - 1 + props.items.length) % props.items.length) }

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
  if (e.key === 'ArrowRight') next()
  if (e.key === 'ArrowLeft') prev()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div v-if="open" class="fixed inset-0 z-50 bg-dark/95 flex items-center justify-center" @click.self="emit('close')">
        <button class="absolute top-6 right-6 text-white/60 hover:text-white text-2xl" @click="emit('close')">✕</button>
        <button class="absolute left-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl" @click="prev">‹</button>
        <button class="absolute right-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl" @click="next">›</button>

        <div class="max-w-5xl max-h-[85vh] w-full mx-6">
          <img
            v-if="current?.mediaType === 'photo'"
            :src="urlFor(current.image).width(1600).url()"
            :alt="current.caption || current.title"
            class="w-full h-full object-contain"
          />
          <div v-else-if="current?.mediaType === 'video'" class="aspect-video">
            <iframe :src="current.videoUrl" class="w-full h-full" allowfullscreen />
          </div>
          <p v-if="current?.caption" class="text-center text-white/50 mt-4">{{ current.caption }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lightbox-enter-active, .lightbox-leave-active { transition: opacity 0.3s ease; }
.lightbox-enter-from, .lightbox-leave-to { opacity: 0; }
</style>
```

**Step 2: Create MediaGrid component**

Create `components/MediaGrid.vue`:

```vue
<script setup lang="ts">
const props = defineProps<{ items: any[] }>()
const emit = defineEmits<{ select: [index: number] }>()
const { urlFor } = useSanityImageUrl()

const containerRef = ref<HTMLElement | null>(null)
useStaggerReveal(containerRef, '.media-card')

function getSize(item: any, index: number): string {
  if (item.featured) return 'col-span-2 row-span-2'
  if (index % 5 === 0) return 'col-span-2'
  return ''
}
</script>

<template>
  <div ref="containerRef" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[200px] md:auto-rows-[250px]">
    <div
      v-for="(item, i) in items"
      :key="item._id"
      class="media-card relative overflow-hidden rounded-lg cursor-pointer group"
      :class="getSize(item, i)"
      @click="emit('select', i)"
    >
      <img
        :src="urlFor(item.mediaType === 'photo' ? item.image : item.videoThumbnail).width(600).height(400).url()"
        :alt="item.caption || item.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div class="absolute inset-0 bg-dark/0 group-hover:bg-dark/50 transition-colors flex items-center justify-center">
        <span v-if="item.mediaType === 'video'" class="text-4xl opacity-70 group-hover:opacity-100 transition-opacity">▶</span>
      </div>
      <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-dark/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <p v-if="item.eventTitle" class="text-xs text-accent">{{ item.eventTitle }}</p>
        <p v-if="item.caption" class="text-sm text-white/80">{{ item.caption }}</p>
      </div>
    </div>
  </div>
</template>
```

**Step 3: Create Media page**

Create `pages/media.vue`:

```vue
<script setup lang="ts">
const query = groq`*[_type == "mediaItem"] | order(uploadDate desc) {
  _id, title, mediaType, image, videoUrl, videoThumbnail, caption, featured, uploadDate,
  "eventTitle": event->title,
  "eventId": event->_id
}`
const { data: allItems } = await useSanityQuery(query)

const eventsQuery = groq`*[_type == "event"] | order(date desc) { _id, title }`
const { data: events } = await useSanityQuery(eventsQuery)

const activeFilter = ref('all')
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

const filteredItems = computed(() => {
  if (!allItems.value) return []
  if (activeFilter.value === 'all') return allItems.value
  if (activeFilter.value === 'photo' || activeFilter.value === 'video') {
    return allItems.value.filter((item: any) => item.mediaType === activeFilter.value)
  }
  return allItems.value.filter((item: any) => item.eventId === activeFilter.value)
})

const filters = computed(() => {
  const base = [
    { label: 'All', value: 'all' },
    { label: 'Photos', value: 'photo' },
    { label: 'Videos', value: 'video' },
  ]
  const eventFilters = (events.value || []).map((e: any) => ({ label: e.title, value: e._id }))
  return [...base, ...eventFilters]
})

function openLightbox(index: number) {
  lightboxIndex.value = index
  lightboxOpen.value = true
}
</script>

<template>
  <div>
    <PageHeader title="MEDIA" />
    <section class="px-6 pb-24">
      <div class="max-w-7xl mx-auto">
        <!-- Filter bar -->
        <div class="flex flex-wrap gap-3 mb-12">
          <button
            v-for="filter in filters"
            :key="filter.value"
            class="font-display text-xs tracking-widest uppercase px-4 py-2 rounded-full border transition-all"
            :class="activeFilter === filter.value
              ? 'bg-accent text-dark border-accent'
              : 'border-white/20 text-white/60 hover:border-accent/50 hover:text-white'"
            @click="activeFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>

        <!-- Grid -->
        <MediaGrid :items="filteredItems" @select="openLightbox" />

        <!-- Empty state -->
        <div v-if="filteredItems.length === 0" class="text-center py-16">
          <p class="text-white/40 text-lg">No media found.</p>
        </div>
      </div>
    </section>

    <MediaLightbox
      :items="filteredItems"
      :current-index="lightboxIndex"
      :open="lightboxOpen"
      @close="lightboxOpen = false"
      @navigate="lightboxIndex = $event"
    />
  </div>
</template>
```

**Step 4: Verify media page**

Run `npm run dev`, navigate to `/media`. Check masonry grid, filters, lightbox open/close/navigation.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: build media page with masonry grid, filters, and lightbox"
```

---

### Task 10: Build Contact Page

**Files:**
- Create: `pages/contact.vue`

**Step 1: Create Contact page**

Create `pages/contact.vue`:

```vue
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
```

**Step 2: Verify contact page**

Run `npm run dev`, navigate to `/contact`. Check social links render, email/phone are clickable.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: build contact page with social links and direct contact info"
```

---

### Task 11: Polish Animations & Responsive Behavior

**Files:**
- Modify: `components/AppNavbar.vue` (smooth transition refinement)
- Modify: `components/HeroSection.vue` (mobile fallback)
- Modify: `assets/css/main.css` (scrollbar, selection, global polish)
- Modify: various components (responsive tweaks)

**Step 1: Add custom scrollbar styling**

Add to `assets/css/main.css`:

```css
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #0a0a0a;
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 229, 255, 0.3);
  border-radius: 3px;
}

/* Smooth scroll */
html {
  scroll-behavior: smooth;
}
```

**Step 2: Add mobile video fallback in HeroSection**

In `HeroSection.vue`, wrap the `<video>` tag with a media query check or use `<picture>` / responsive approach so mobile devices get the static fallback image instead of loading a heavy video.

**Step 3: Test all pages at mobile, tablet, desktop breakpoints**

Walk through every page at 375px, 768px, and 1280px widths. Fix any overflow, spacing, or readability issues.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: polish animations, responsive behavior, and global styles"
```

---

### Task 12: SEO, Meta Tags & Static Generation

**Files:**
- Modify: `nuxt.config.ts` (SSG config, meta)
- Modify: each `pages/*.vue` (page-level meta)

**Step 1: Add page-level meta tags**

In each page file, add `useHead()` or `useSeoMeta()`:

```typescript
useSeoMeta({
  title: 'Events | SKY Events Asia',
  ogTitle: 'Events | SKY Events Asia',
  description: 'Upcoming and past electronic music events by SKY Events Asia',
  ogDescription: 'Upcoming and past electronic music events by SKY Events Asia',
})
```

**Step 2: Configure static generation**

In `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  // ... existing config
  nitro: {
    prerender: {
      routes: ['/', '/events', '/about', '/media', '/contact'],
    },
  },
})
```

**Step 3: Build and test static output**

```bash
npm run generate
npx serve .output/public
```

Verify all pages load correctly as static HTML.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add SEO meta tags and configure static site generation"
```

---

### Task 13: Deploy

**Step 1: Push to GitHub**

```bash
git remote add origin <GITHUB_REPO_URL>
git push -u origin master
```

**Step 2: Connect to Vercel or Netlify**

Import the repository, set framework to Nuxt 3. Add environment variables for Sanity project ID and dataset.

**Step 3: Verify production deployment**

Check all pages, animations, Sanity content loads correctly in production.

**Step 4: Deploy Sanity Studio**

```bash
cd sanity && npx sanity deploy
```

Choose a hostname (e.g., `sky-events-asia.sanity.studio`).

**Step 5: Commit any deployment config**

```bash
git add -A
git commit -m "chore: add deployment configuration"
```
