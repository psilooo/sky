# SKY Events Asia — Codebase Map

> A comprehensive reference for coding agents to quickly locate and understand any part of the codebase.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [File Tree](#2-file-tree)
3. [Technology Stack](#3-technology-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Configuration Files](#5-configuration-files)
6. [Composables (Shared Logic)](#6-composables)
7. [Plugins](#7-plugins)
8. [Layouts](#8-layouts)
9. [Pages & Routing](#9-pages--routing)
10. [Components](#10-components)
11. [R2 Worker (Sub-project)](#11-r2-worker-sub-project)
12. [Sanity CMS Integration](#12-sanity-cms-integration)
13. [Styling System](#13-styling-system)
14. [Animation System](#14-animation-system)
15. [Data Flow](#15-data-flow)
16. [Key Patterns & Conventions](#16-key-patterns--conventions)
17. [Planning Documents](#17-planning-documents)

---

## 1. Project Overview

**SKY Events Asia** is a marketing website for an electronic music festival production company based in Asia. Built with **Nuxt 3** (Vue 3), it features:

- Dark-themed, animation-rich design
- Headless CMS content management via **Sanity v3**
- Media storage on **Cloudflare R2** with a custom Worker API
- GSAP-powered scroll animations
- Static site generation (SSG) with prerendered routes

**Sanity Project ID:** `glybi1mo` / **Dataset:** `production`
**R2 Worker URL:** `https://skyevents.workers.dev`
**R2 Public CDN:** `https://pub-df7b858a029a4ffe9e251cd85ad89447.r2.dev`

---

## 2. File Tree

```
/Users/sam/Desktop/SKY/
├── app.vue                          # Root component — wraps NuxtLayout
├── nuxt.config.ts                   # Master Nuxt configuration
├── package.json                     # Dependencies & scripts
├── tailwind.config.ts               # Tailwind theme (colors, fonts)
├── tsconfig.json                    # Root TypeScript config
├── about.txt                        # Planning notes (not in build)
├── README.md                        # Default Nuxt starter README
├── borderland.webp                  # Static image asset
│
├── assets/
│   └── css/
│       └── main.css                 # Global CSS: Tailwind directives, transitions, scrollbar
│
├── components/
│   ├── AboutTeaser.vue              # Homepage about section with word rotator
│   ├── AppFooter.vue                # Site footer (social links, copyright)
│   ├── AppNavbar.vue                # Fixed header nav with scroll detection
│   ├── EventCard.vue                # Poster thumbnail card (hover overlay, emits toggle)
│   ├── EventsTeaser.vue             # Homepage events preview (upcoming/recent)
│   ├── HeroSection.vue              # Full-viewport hero with video + parallax
│   ├── MediaGrid.vue                # Masonry grid of media items
│   ├── MediaHighlight.vue           # Homepage featured media preview
│   ├── MediaLightbox.vue            # Fullscreen media viewer with keyboard nav
│   ├── MobileMenu.vue               # Fullscreen mobile nav overlay
│   ├── PageHeader.vue               # Reusable animated page title
│   ├── SanityContent.vue            # Portable Text renderer wrapper
│   └── TeamCard.vue                 # Team member card with grayscale hover
│
├── composables/
│   ├── useGsap.ts                   # GSAP animation composables (3 exports)
│   ├── useR2Image.ts                # R2 image URL helper (null-safe passthrough)
│   └── useSanity.ts                 # Sanity client, query wrapper, groq tag
│
├── docs/
│   └── plans/
│       ├── 2026-01-30-sky-events-implementation-plan.md
│       ├── 2026-01-30-sky-events-website-design.md
│       ├── 2026-02-03-r2-media-integration-design.md
│       └── 2026-02-03-r2-media-integration-plan.md
│
├── layouts/
│   └── default.vue                  # AppNavbar → <slot> → AppFooter
│
├── pages/
│   ├── index.vue                    # Homepage: Hero, Events, About, Media teasers
│   ├── about.vue                    # About: hero, story (Portable Text), team grid
│   ├── contact.vue                  # Contact: social links, email, phone
│   ├── events.vue                   # Events: tabbed upcoming/past, expandable cards
│   └── media.vue                    # Media: filterable grid + lightbox
│
├── plugins/
│   └── gsap.client.ts               # Client-only: registers GSAP + ScrollTrigger + ScrollToPlugin
│
├── public/
│   └── robots.txt                   # SEO: allows all crawlers
│
├── r2-worker/                       # Cloudflare Worker sub-project
│   ├── src/
│   │   └── index.ts                 # Worker: upload, list, delete endpoints
│   ├── wrangler.toml                # Worker config: R2 binding, public URL
│   ├── package.json                 # Worker dependencies (wrangler, types)
│   ├── tsconfig.json                # Worker TypeScript config
│   └── subdomain.txt                # Deployment URL reference
│
└── server/
    └── tsconfig.json                # Server-side TypeScript config
```

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Nuxt 3 | 3.21.0 | Vue meta-framework, SSG, file-based routing |
| UI | Vue 3 | (bundled) | Composition API, SFCs |
| Styling | Tailwind CSS | via @nuxtjs/tailwindcss 6.14.0 | Utility-first CSS |
| Fonts | Google Fonts | via @nuxtjs/google-fonts | Bebas Neue, Space Grotesk, Anton |
| Animations | GSAP | 3.14.2 | ScrollTrigger, ScrollToPlugin |
| CMS | Sanity v3 | @sanity/client 7.14.1 | Headless content management |
| Rich Text | @portabletext/vue | (installed) | Renders Sanity Portable Text |
| Storage | Cloudflare R2 | — | Media file storage |
| API | Cloudflare Workers | wrangler 3.x | R2 upload/list/delete proxy |
| Build | TypeScript | 5.x | Type safety throughout |

### NPM Scripts

```bash
npm run dev        # Start dev server on localhost:3000
npm run build      # Production build (static generation)
npm run generate   # Alias for static site generation
npm run preview    # Preview production build locally
npm run postinstall # Runs `nuxt prepare` automatically
```

---

## 4. Architecture Overview

### Component Hierarchy

```
app.vue
└── NuxtLayout (layouts/default.vue)
    ├── AppNavbar
    │   └── MobileMenu
    ├── <slot> → NuxtPage (file-based routing)
    │   ├── index.vue ────→ HeroSection, EventsTeaser×2, AboutTeaser, MediaHighlight
    │   ├── events.vue ──→ PageHeader, EventCard[] (3-col poster grid), expand-below-row detail panels
    │   ├── about.vue ───→ PageHeader, SanityContent, TeamCard[]
    │   ├── media.vue ───→ PageHeader, MediaGrid, MediaLightbox
    │   └── contact.vue ─→ PageHeader
    └── AppFooter
```

### Data Flow

```
Sanity CMS (glybi1mo)              Cloudflare R2
    │                                    │
    │ GROQ queries                       │ Public CDN URLs
    ▼                                    ▼
useSanityQuery() ──────────────→ Components ←── useR2Image()
    │                              │
    │ SSR/SSG fetch               │ Direct <img src>
    ▼                              ▼
Reactive data (Ref<T>)         Browser renders images
```

### Build & Deployment

```
npm run build/generate
    └── Nuxt reads nuxt.config.ts
        ├── Loads modules (@nuxtjs/tailwindcss, @nuxtjs/google-fonts)
        ├── Processes assets/css/main.css
        ├── Applies tailwind.config.ts
        ├── Compiles TypeScript
        └── Prerenders: /, /events, /about, /media, /contact
```

---

## 5. Configuration Files

### `nuxt.config.ts` — Master Configuration

| Line(s) | Setting | Value / Purpose |
|---------|---------|-----------------|
| 3 | `devtools: { enabled: true }` | Nuxt DevTools in development |
| 4 | `modules` | `@nuxtjs/tailwindcss`, `@nuxtjs/google-fonts` |
| 6 | `css` | `~/assets/css/main.css` |
| 7-15 | `runtimeConfig.public.sanity` | `projectId: 'glybi1mo'`, `dataset: 'production'`, `apiVersion: '2025-01-30'` |
| 17-22 | `googleFonts` | Bebas Neue (400), Space Grotesk (300-700), Anton (400) |
| 24-26 | `nitro.prerender.routes` | `/, /events, /about, /media, /contact` |
| 28-33 | `app.head` | Title: "SKY Events Asia", meta description |
| 35 | `app.pageTransition` | `{ name: 'page', mode: 'out-in' }` |

### `tailwind.config.ts` — Design Tokens

```typescript
theme: {
  extend: {
    colors: {
      dark: '#0a0a0a',           // Primary background
      'dark-lighter': '#141414', // Section backgrounds
      accent: '#00e5ff',         // Cyan accent (CTAs, hovers, scrollbar)
    },
    fontFamily: {
      display: ['Bebas Neue'],   // Headings, page titles
      body: ['Space Grotesk'],   // Body text, paragraphs
      logo: ['Anton'],           // Logo text
    },
  },
}
```

### `assets/css/main.css` — Global Styles

| Section | What It Does |
|---------|-------------|
| Lines 1-3 | Tailwind directives (`@tailwind base/components/utilities`) |
| Lines 5-7 | Body defaults: `bg-dark text-white font-body` |
| Lines 9-11 | Text selection: accent background, dark text |
| Lines 13-21 | Page transitions: 0.3s opacity fade (matches `pageTransition` config) |
| Lines 23-33 | Custom scrollbar: 6px wide, accent thumb, dark track (WebKit only) |
| Lines 35-38 | `scroll-behavior: smooth` on html element |

### `package.json` — Key Dependencies

**Runtime:** `gsap`, `@sanity/client`, `@portabletext/vue`, `nuxt`, `vue`
**Dev:** `@nuxtjs/tailwindcss`, `@nuxtjs/google-fonts`, `typescript`

### `tsconfig.json`

Extends `.nuxt/tsconfig.json` (auto-generated). No custom overrides.

---

## 6. Composables

### `composables/useGsap.ts` — Animation Utilities

Three exported composables + one internal helper:

| Export | Signature | Purpose |
|--------|-----------|---------|
| `useScrollReveal` | `(el: Ref<HTMLElement>, options?: gsap.TweenVars)` | Fade-in from below on scroll |
| `useStaggerReveal` | `(container: Ref<HTMLElement>, childSelector: string, options?: gsap.TweenVars)` | Stagger children on scroll |
| `useTextReveal` | `(el: Ref<HTMLElement>)` | Clip-path left-to-right text reveal |

**Default animation parameters:**

| Composable | Duration | Y Offset | Easing | Trigger Point | Stagger |
|-----------|----------|----------|--------|--------------|---------|
| `useScrollReveal` | 1s | 60px | power3.out | top 85% | — |
| `useStaggerReveal` | 0.8s | 60px | power3.out | top 85% | 0.15s |
| `useTextReveal` | 1.2s | — | power4.inOut | top 85% | — |

**All composables:**
- Create animations in `onMounted`
- Kill tweens + ScrollTrigger in `onUnmounted`
- Call `ScrollTrigger.refresh()` after setup via `nextTick`
- Accept null refs safely (early return)

**Used by:** PageHeader, AboutTeaser, EventsTeaser, MediaGrid, MediaHighlight, about.vue, events.vue, contact.vue

### `composables/useR2Image.ts` — Image URL Helper

```typescript
export function useR2Image(): { imageUrl: (url: string | null | undefined) => string }
```

- Returns the URL as-is if truthy, empty string if null/undefined
- Pure utility — no reactive state, no API calls, no transformations
- Abstracts image handling so future optimizations (resizing, format conversion) require zero component changes

**Used by:** EventCard, HeroSection, EventsTeaser, MediaGrid, MediaHighlight, MediaLightbox, TeamCard, about.vue

### `composables/useSanity.ts` — CMS Integration

| Export | Purpose |
|--------|---------|
| `groq` | Tagged template literal for GROQ queries (enables IDE syntax highlighting) |
| `useSanityClient()` | Creates `@sanity/client` instance from `runtimeConfig.public.sanity` with `useCdn: false` |
| `useSanityQuery<T>(query, params?)` | Wraps `useAsyncData` + `client.fetch()` — SSR-compatible, cached by query string |

**Returns `AsyncData<T>`:** `{ data: Ref<T | null>, pending: Ref<boolean>, error: Ref<Error | null>, refresh() }`

**Used by:** Every page and several components (AppFooter, HeroSection, EventsTeaser, MediaHighlight)

---

## 7. Plugins

### `plugins/gsap.client.ts`

- **Client-only** (`.client.ts` suffix prevents SSR execution)
- Registers GSAP plugins globally: `ScrollTrigger`, `ScrollToPlugin`
- Provides `$gsap` and `$ScrollTrigger` via Nuxt injection (though components use direct imports)
- Must run before any GSAP animation composable

---

## 8. Layouts

### `layouts/default.vue`

```html
<div class="min-h-screen bg-dark text-white">
  <AppNavbar />
  <main><slot /></main>
  <AppFooter />
</div>
```

- Only layout in the app — all pages use it
- Three-section structure: navbar (persistent) → page content (slot) → footer (persistent)
- Dark background and white text applied at layout level

---

## 9. Pages & Routing

All routes are file-based (Nuxt convention). Every page uses `useSeoMeta()` for title/description/OG tags.

### `pages/index.vue` — Homepage (`/`)

- **Script:** Only `useSeoMeta()` — all logic delegated to child components
- **Template:** `HeroSection` → `EventsTeaser(type="upcoming")` → `EventsTeaser(type="recent")` → `AboutTeaser` → `MediaHighlight`
- **Data:** None at page level; each component fetches its own data

### `pages/events.vue` — Events (`/events`)

- **Features:** Tabbed view (upcoming/recent), 3-column poster grid (1-col mobile), expand-below-row detail panels, deep-linking via query params
- **Query params:** `?tab=upcoming|recent&event={sanityId}` — auto-selects tab and expands + scrolls to event
- **Data:** Fetches all events via GROQ (including `poster` field), filters client-side by date comparison
- **State:** `activeTab` (ref), `expandedId` (ref), computed `upcomingEvents`/`pastEvents`/`displayedEvents`, `eventRows` (groups of 3), `expandedEvent`
- **Grid layout:** `grid grid-cols-1 md:grid-cols-3 gap-6`; events grouped into rows; detail panel spans all columns below expanded event's row
- **Animations:** Stagger reveal on grid items, GSAP expand (0.6s) / collapse (0.3s) for detail panel, sequential close-then-open for switching, auto-scroll into view, Vue `<Transition>` for tab switch

### `pages/about.vue` — About (`/about`)

- **Data:** Two queries — `siteSettings` (aboutStory, aboutHeroImage, aboutTagline) + `teamMember` collection (ordered by `order` field)
- **Sections:** Hero with background image → Story (Portable Text via SanityContent) → Team grid (TeamCard)
- **Animations:** `useScrollReveal(storyRef)`, `useStaggerReveal(teamRef, '.team-card')`

### `pages/media.vue` — Media (`/media`)

- **Data:** Two queries — all `mediaItem` docs (with dereferenced event title/id) + all events (for filter dropdown)
- **State:** `activeFilter` (all/photo/video/eventId), `lightboxOpen`, `lightboxIndex`
- **Filter logic:** Computed `filteredItems` switches on filter value; `filters` computed merges base filters + event-specific filters
- **Components:** Filter pills → `MediaGrid(:items, @select)` → `MediaLightbox(:items, :currentIndex, :open, @close, @navigate)`

### `pages/contact.vue` — Contact (`/contact`)

- **Data:** siteSettings query for `contactEmail`, `contactPhone`, `contactTagline`, `socialLinks[]`
- **Features:** Social link buttons with glow hover, `mailto:` and `tel:` links
- **Map:** `platformLabels` object maps internal keys to display names (instagram → "Instagram", twitter → "X / Twitter")

---

## 10. Components

### Navigation & Layout

| Component | File | Purpose | Props | Key Behavior |
|-----------|------|---------|-------|-------------|
| **AppNavbar** | `components/AppNavbar.vue` | Fixed header navigation | — | Scroll listener toggles `bg-dark/90 backdrop-blur-sm` at 50px; closes mobile menu on route change; links: Events, About, Media, Contact |
| **MobileMenu** | `components/MobileMenu.vue` | Fullscreen mobile nav | `open: boolean`, `links: {label, to}[]` | Emits `close` on link click; Vue Transition fade; `useRoute()` for active state highlighting |
| **AppFooter** | `components/AppFooter.vue` | Site footer | — | Fetches siteSettings (social links, copyright); renders social icons + copyright text |
| **PageHeader** | `components/PageHeader.vue` | Animated page title | `title: string` | `useTextReveal()` clip-path animation; `pt-32` accounts for fixed navbar |

### Homepage Sections

| Component | File | Purpose | Data Source |
|-----------|------|---------|------------|
| **HeroSection** | `components/HeroSection.vue` | Full-viewport hero | siteSettings: heroVideoUrl, heroFallbackImage |
| **EventsTeaser** | `components/EventsTeaser.vue` | Event preview cards | Events filtered by type prop (upcoming/recent), limited to 3 |
| **AboutTeaser** | `components/AboutTeaser.vue` | About section teaser | siteSettings: aboutTagline; rotating words |
| **MediaHighlight** | `components/MediaHighlight.vue` | Featured media grid | mediaItem (featured=true), limited to 5 |

**HeroSection details:**
- Desktop: video background (muted, autoplay, loop); Mobile: fallback image
- SVG logo overlay (inline, white fill)
- GSAP: tagline fade-in (1.5s, 0.5s delay), scroll indicator bounce (infinite yoyo), parallax background (30% yPercent scrub)

**EventsTeaser details:**
- `type` prop: `"upcoming"` or `"recent"` — determines GROQ filter (`date > now()` vs `date <= now()`)
- Limited to 3 results; each card links to `/events?tab={type}&event={id}`
- `useStaggerReveal()` on mount

**AboutTeaser details:**
- Rotating word animation: cycles through array every 2.5s via GSAP timeline
- `useScrollReveal()` for section entrance

### Content Components

| Component | File | Props | Key Features |
|-----------|------|-------|-------------|
| **EventCard** | `components/EventCard.vue` | `event: SanityDocument` | Poster thumbnail card; portrait aspect ratio (1349:1685); shows `poster` image (fallback to `featuredImage`); title+date appear on hover via CSS opacity transition; emits `toggle` with event `_id`; no expansion logic (handled by events.vue) |
| **SanityContent** | `components/SanityContent.vue` | `blocks: any[]` | Thin wrapper around `<PortableText :value="blocks" />` from @portabletext/vue |
| **TeamCard** | `components/TeamCard.vue` | `member: {name, role, bio?, photo?}` | Portrait 3:4 aspect ratio; CSS grayscale → color on hover; uses `useR2Image()` |

### Media Components

| Component | File | Props | Emits | Key Features |
|-----------|------|-------|-------|-------------|
| **MediaGrid** | `components/MediaGrid.vue` | `items: any[]` | `select(index)` | CSS Grid: 2/3/4 cols responsive; `getSize()` gives featured items `col-span-2 row-span-2`, every 5th item `col-span-2`; row heights 200px/250px; `useStaggerReveal()` |
| **MediaHighlight** | `components/MediaHighlight.vue` | — (self-fetching) | — | Grid: first item 2×2, rest 4:3; all link to /media |
| **MediaLightbox** | `components/MediaLightbox.vue` | `items`, `currentIndex`, `open` | `close`, `navigate(index)` | `<Teleport to="body">`; keyboard nav (←/→/Esc); wrapping navigation; photo or iframe video display; Vue Transition fade |

---

## 11. R2 Worker (Sub-project)

**Location:** `/Users/sam/Desktop/SKY/r2-worker/`
**Deployed at:** `https://skyevents.workers.dev`

### Environment Bindings

```typescript
interface Env {
  MEDIA_BUCKET: R2Bucket        // R2 bucket "skyeventsasia"
  API_KEY: string               // Secret: Bearer token for auth
  PUBLIC_BUCKET_URL: string     // "https://pub-df7b858a029a4ffe9e251cd85ad89447.r2.dev"
}
```

### API Endpoints

| Method | Path | Auth | Purpose | Request | Response |
|--------|------|------|---------|---------|----------|
| OPTIONS | * | No | CORS preflight | — | 204 + CORS headers |
| POST | /upload | Yes | Upload media file | multipart/form-data: `file` + `category` | `{url, key, filename, category, size}` |
| GET | /list | Yes | List files | query: `?category=events\|team\|general` | `{files: [{key, url, filename, category, size, uploaded}]}` |
| DELETE | /delete | Yes | Delete file | JSON: `{key: "..."}` | `{success: true, key}` |

### Validation Rules

- **Allowed categories:** `events`, `team`, `general`
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`
- **Max file size:** 10MB
- **Key format:** `{category}/{timestamp}-{sanitized-filename}`

### Authentication

All endpoints except OPTIONS require `Authorization: Bearer <API_KEY>` header. Single shared key stored as Cloudflare secret.

### CORS

Wide-open (`Access-Control-Allow-Origin: *`) — acceptable because all mutation endpoints require Bearer auth.

### Development Commands

```bash
cd r2-worker
npm run dev       # Local worker development
npm run deploy    # Deploy to Cloudflare
wrangler secret put API_KEY  # Set the API secret
```

---

## 12. Sanity CMS Integration

### Content Types (Schemas)

Located in the separate Sanity Studio project at `/Users/sam/Desktop/SKY-sanity-studio/schemaTypes/`:

| Schema | Type | Key Fields |
|--------|------|-----------|
| **event** | document | title, slug, date (datetime), venue, location, description (Portable Text), featuredImage (R2 string), poster (R2 string, vertical 1349x1685), gallery (R2 string[]), videoUrl, lineup (string[]) |
| **teamMember** | document | name, role, bio, photo (R2 string), order (number for sorting) |
| **mediaItem** | document | title, mediaType (photo/video), image (R2 string), videoUrl, videoThumbnail (R2 string), caption, featured (boolean), uploadDate, event (reference→event) |
| **siteSettings** | document (singleton) | heroTagline, heroVideoUrl, heroFallbackImage, aboutStory (Portable Text), aboutHeroImage, aboutTagline, contactEmail, contactPhone, contactTagline, socialLinks[] ({platform, url}), copyrightText |

### Image Storage Strategy

Images are stored as **plain URL strings** pointing to R2 public CDN. The Sanity Studio uses a custom `R2ImageInput` component that opens a media browser, uploads to R2 via the Worker API, and saves the returned URL as a string field.

### GROQ Query Patterns Used

```groq
// Singleton settings
*[_type == "siteSettings"][0]{ field1, field2, ... }

// Ordered collection
*[_type == "event"] | order(date desc) { _id, title, ... }

// Filtered + limited
*[_type == "mediaItem" && featured == true] | order(uploadDate desc) [0..4] { ... }

// Date-based filtering (client-side)
// Events fetched, then filtered: e.date > new Date().toISOString()

// Relationship dereferencing
"eventTitle": event->title, "eventId": event->_id
```

---

## 13. Styling System

### Design Tokens

| Token | CSS Class | Value | Usage |
|-------|-----------|-------|-------|
| Dark background | `bg-dark` | #0a0a0a | Primary background |
| Lighter dark | `bg-dark-lighter` | #141414 | Alternating sections |
| Accent | `text-accent`, `bg-accent`, `border-accent` | #00e5ff | CTAs, hovers, active states, scrollbar |
| Display font | `font-display` | Bebas Neue | Page titles, headings, buttons |
| Body font | `font-body` | Space Grotesk | Paragraphs, body text |
| Logo font | `font-logo` | Anton | Logo/brand text |

### Common Tailwind Patterns

```
// Responsive text sizing
text-4xl md:text-5xl lg:text-8xl

// Responsive grids
grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4

// Desktop/mobile toggle
hidden md:flex  /  md:hidden

// Container centering
max-w-7xl mx-auto px-6

// Hover effects
group-hover:scale-105 group-hover:grayscale-0 transition-all duration-500

// Glow effect
hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]

// Gradient overlays
bg-gradient-to-t from-dark to-transparent

// Subtle borders
border border-white/10 hover:border-accent
```

### Responsive Breakpoints

- **Mobile-first** approach throughout
- **md** (768px): Tablet — nav links visible, grids expand
- **lg** (1024px): Desktop — full grid columns, larger text

---

## 14. Animation System

### GSAP Plugin Registration (`plugins/gsap.client.ts`)

Registers `ScrollTrigger` and `ScrollToPlugin` globally on client. All animation composables depend on this.

### Composable Animations

| Animation | Composable | Visual Effect | Duration | Trigger |
|-----------|-----------|---------------|----------|---------|
| Scroll reveal | `useScrollReveal()` | Fade up from 60px below | 1s | Scroll to 85% viewport |
| Stagger reveal | `useStaggerReveal()` | Children fade up sequentially | 0.8s, 0.15s stagger | Scroll to 85% viewport |
| Text reveal | `useTextReveal()` | Clip-path wipe left to right | 1.2s | Scroll to 85% viewport |

### Manual GSAP Animations

| Location | Effect | Details |
|----------|--------|---------|
| HeroSection | Logo fade-in | opacity 0→1, y 30→0; 1.5s, 0.5s delay |
| HeroSection | Scroll indicator bounce | y 0→10; infinite yoyo; 1.5s |
| HeroSection | Parallax | yPercent 0→30; ScrollTrigger scrub |
| events.vue | Detail panel expand | height 0→auto, opacity 0→1 (0.6s power2.out) |
| events.vue | Detail panel collapse | height→0, opacity→0 (0.3s power2.in) |
| events.vue | Auto-scroll | GSAP scrollTo; 0.8s after expand, 1.5s on deep link |
| AboutTeaser | Word rotation | 2.5s interval cycling through words array |

### CSS Transitions (Non-GSAP)

| Component | Effect | CSS |
|-----------|--------|-----|
| MobileMenu | Fade in/out | `.menu-enter/leave-active { transition: opacity 0.3s }` |
| MediaLightbox | Fade in/out | `.lightbox-enter/leave-active { transition: opacity 0.3s }` |
| Page transitions | Cross-fade | `.page-enter/leave-active { transition: opacity 0.3s }` (main.css) |
| MediaGrid items | Hover scale | `group-hover:scale-110 transition-transform duration-500` |
| TeamCard | Hover desaturate | `grayscale group-hover:grayscale-0 transition-all duration-500` |

### Cleanup Pattern

Every GSAP animation follows this pattern:
```typescript
let tween: gsap.core.Tween
onMounted(() => {
  tween = gsap.from(el.value, { /* ... */ })
})
onUnmounted(() => {
  tween?.scrollTrigger?.kill()
  tween?.kill()
})
```

---

## 15. Data Flow

### Content Fetching Pattern

Every data fetch in the app follows this pattern:
```typescript
const query = groq`*[_type == "..."]{ ... }`
const { data } = await useSanityQuery(query)
```

The `await` in `<script setup>` suspends rendering until data loads (SSR-compatible). Nuxt's `useAsyncData` caches by query string, preventing duplicates.

### Where Data Is Fetched

| File | What's Fetched | Sanity Type |
|------|---------------|-------------|
| `pages/index.vue` | Nothing (child components fetch) | — |
| `pages/events.vue` | All events | event |
| `pages/about.vue` | siteSettings + teamMembers | siteSettings, teamMember |
| `pages/media.vue` | All mediaItems + all events (for filters) | mediaItem, event |
| `pages/contact.vue` | siteSettings (contact fields) | siteSettings |
| `components/AppFooter.vue` | siteSettings (social, copyright) | siteSettings |
| `components/HeroSection.vue` | siteSettings (hero fields) | siteSettings |
| `components/EventsTeaser.vue` | Events (filtered by type prop) | event |
| `components/MediaHighlight.vue` | Featured mediaItems (limit 5) | mediaItem |

### Image URL Flow

```
Sanity document field (string URL)
    → Component reads via useSanityQuery
    → Passed to useR2Image().imageUrl()
    → Returns URL or "" for null
    → Used as <img :src="...">
    → Browser fetches from R2 public CDN
```

---

## 16. Key Patterns & Conventions

### File Organization

- `/pages/` — File-based routing (auto-registered)
- `/components/` — Auto-imported components (no manual imports needed)
- `/composables/` — Auto-imported composables
- `/layouts/` — Page layout templates
- `/plugins/` — Nuxt plugins (`.client.ts` = browser-only)
- `/assets/` — Build-processed assets
- `/public/` — Static files served as-is
- `/server/` — Server-side code (currently empty except tsconfig)

### Naming Conventions

- **Components:** PascalCase, descriptive (`AppNavbar`, `EventCard`, `MediaLightbox`)
- **App-prefix:** Global app components (`AppNavbar`, `AppFooter`)
- **Pages:** lowercase, match route (`events.vue` → `/events`)
- **Composables:** `use` prefix (`useGsap`, `useSanity`, `useR2Image`)
- **Plugins:** descriptive with `.client` suffix for browser-only

### Component Patterns

1. **Self-fetching components** — Fetch their own data via `useSanityQuery()` (HeroSection, EventsTeaser, AppFooter, MediaHighlight, AboutTeaser)
2. **Prop-driven components** — Receive data from parent (EventCard, TeamCard, SanityContent, PageHeader, MediaGrid, MediaLightbox, MobileMenu)
3. **Props down, events up** — State managed by parent, child emits events (EventCard toggle, MediaGrid select, MediaLightbox close/navigate, MobileMenu close)

### SEO Pattern

Every page starts with:
```typescript
useSeoMeta({
  title: 'Page | SKY Events Asia',
  ogTitle: 'Page | SKY Events Asia',
  description: '...',
  ogDescription: '...',
})
```

### Error Handling

- **Minimal explicit error handling** — relies on Nuxt/Vue defaults
- `useAsyncData` provides `error` ref but pages don't render error states
- R2 image composable returns empty string for null (prevents broken images)
- GSAP composables guard against null refs (`if (!el.value) return`)
- Worker returns structured error JSON with status codes

---

## 17. Planning Documents

Located in `/docs/plans/`:

| Document | Date | Purpose |
|----------|------|---------|
| `sky-events-implementation-plan.md` | 2026-01-30 | 13-task build plan for entire website |
| `sky-events-website-design.md` | 2026-01-30 | Visual design specification (colors, typography, animations, page layouts) |
| `r2-media-integration-design.md` | 2026-02-03 | Architecture for replacing Sanity assets with R2 |
| `r2-media-integration-plan.md` | 2026-02-03 | 10-task implementation plan for R2 migration |

**Status:** All plans fully implemented. The codebase represents the complete vision from all four documents.

### Architectural Evolution

- **Phase 1 (Jan 30):** Website built with Sanity's built-in image assets
- **Phase 2 (Feb 3):** Migrated to Cloudflare R2 — images stored as plain URL strings, custom Worker API, custom Sanity Studio media library plugin

---

## Quick Reference: "Where Do I Find...?"

| If you need to... | Look at... |
|-------------------|-----------|
| Change site-wide colors/fonts | `tailwind.config.ts` |
| Modify navigation links | `components/AppNavbar.vue` (lines ~20-25, links array) |
| Add a new page | Create `pages/newpage.vue`, add route to `nuxt.config.ts` prerender |
| Change Sanity project/dataset | `nuxt.config.ts` lines 7-15 |
| Modify scroll animations | `composables/useGsap.ts` |
| Change image URL handling | `composables/useR2Image.ts` |
| Add new Sanity query | Use `useSanityQuery()` from `composables/useSanity.ts` |
| Modify page transitions | `assets/css/main.css` lines 13-21 |
| Edit the R2 Worker API | `r2-worker/src/index.ts` |
| Change R2 upload limits | `r2-worker/src/index.ts` lines 7-9 |
| Add new content type | Sanity Studio schemas (separate project) |
| Change global layout | `layouts/default.vue` |
| Modify SEO tags | Each `pages/*.vue` file's `useSeoMeta()` call |
| Change footer content | `components/AppFooter.vue` (fetches from siteSettings) |
| Add new homepage section | `pages/index.vue` — add component in template |
| Debug GSAP animations | Check `plugins/gsap.client.ts` registration, then composable in question |
