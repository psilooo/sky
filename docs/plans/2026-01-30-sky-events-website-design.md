# SKY Events Asia — Website Design

## Overview

A static marketing website for **SKY Events Asia**, an electronic music festival production company based in Asia. The site should feel dark, immersive, and cinematic — with bold motion and graphic elements where it counts, and restraint everywhere else. Modern, sleek, electronic festival vibes.

## Tech Stack

- **Nuxt 3** (Vue meta-framework) — file-based routing, static site generation, SEO
- **Tailwind CSS** — utility-first styling
- **GSAP** — scroll-triggered animations, text reveals, page transitions
- **Sanity** — headless CMS for events, team members, media, social links
- **Vercel or Netlify** — deployment/hosting

## Design Language

- **Colors:** Near-black backgrounds (#0a0a0a), electric blue/cyan accent for glows and highlights, white/light gray text
- **Typography:** Bold uppercase display font for headings (e.g., Bebas Neue, Archivo Black, Monument Extended) + clean sans-serif for body (e.g., Inter, Space Grotesk)
- **Motion:** Dramatic hero and key section animations (GSAP), scroll-triggered reveals, hover effects. Restrained elsewhere — subtle fades and transitions
- **Accent color:** Defined as a Tailwind CSS variable, easy to swap

## Navigation

- Fixed top nav bar, transparent over hero sections, solid dark on scroll
- Logo left, page links right
- Mobile: hamburger menu with full-screen animated overlay
- Active page highlighted with accent color
- Smooth page transitions via Nuxt transitions + GSAP

## Pages

### Home (`/`)

**Hero Section**
- Full-viewport aftermovie video background (muted, autoplay, loop)
- Dark overlay with centered SKY EVENTS ASIA logo
- Tagline fades in beneath logo
- Subtle parallax drift on scroll
- Scroll indicator pulses at bottom
- Falls back to static image on mobile/slow connections

**Upcoming Events Teaser**
- 2-3 upcoming events animate in with staggered reveals
- Each shows: event name, date, venue, background image
- Hover effect: slight scale + glow
- Links to full Events page
- Pulled from Sanity; hides automatically if no upcoming events

**About Teaser**
- One-liner about SKY Events Asia
- Moody background image or gradient
- Text animates on scroll
- "Learn More" link to About page

**Media Highlight**
- 3-5 curated photos/videos in asymmetric layout
- Pulled from Sanity media collection
- Click opens lightbox or navigates to Media page
- Scroll-triggered entrance animations

**Footer** (global)
- Social media icons
- Contact email/phone
- SKY Events Asia wordmark
- Dark, minimal

### Events (`/events`)

**Header**
- "EVENTS" bold text-reveal animation on load
- Toggle/tabs: Upcoming | Past

**Event Cards**
- Wide card/row layout: event name, date, venue/location, background image
- Glowing border/accent on hover
- Staggered fade-in on scroll

**Expandable Detail View**
- Click expands card inline (smooth height animation)
- Expanded content:
  - Extended description
  - Lineup/artists (if applicable)
  - Photo gallery (carousel or small grid)
  - Video recap embed (if available)
  - Venue details and location
- Close button or click header to collapse
- Only one event expanded at a time

**Sanity Schema: Event**
- Title, date, venue, location
- Description (rich text)
- Featured image
- Gallery images
- Video URL
- Lineup (list of strings)
- Status flag (upcoming/past — auto-determined by date)

**Empty States**
- No upcoming events: "Stay tuned" message + social links
- Past events: newest first

### About (`/about`)

**Hero**
- Full-width atmospheric image (crowd, stage, venue) with dark overlay
- "ABOUT" text clip animation
- Optional tagline fade-in

**Company Story**
- Narrative blocks: who, how it started, mission, event style, regions
- Scroll-triggered fade-ins
- Interspersed moody photos
- Managed in Sanity as rich text

**Team Section**
- Grid or staggered layout of team member cards
- Each card: photo, name, role/title, optional short bio
- Hover effect: desaturate-to-color or subtle zoom
- Staggered reveal on scroll
- Managed in Sanity as own document type

### Media (`/media`)

**Header**
- "MEDIA" text reveal on load

**Filter Bar**
- Horizontal tabs/pills: All, Photos, Videos, or by event name
- Smooth shuffle/reflow animation on filter change

**Layout: Dynamic Masonry**
- Varying card sizes (large hero, medium, small) for visual rhythm
- Featured items get larger cards
- Layout shifts on filter for variety

**Photo Items**
- Hover: overlay with event name and date
- Click: fullscreen lightbox with swipe/arrow navigation
- Smooth zoom-in transition from grid to lightbox

**Video Items**
- Play icon overlay on thumbnail
- Hover: looping preview (first few seconds, muted)
- Click: lightbox with embedded video player (YouTube/Vimeo)

**Sanity Schema: Media Item**
- Type (photo/video)
- Image or video URL
- Associated event (reference)
- Caption
- Featured flag (boolean)
- Upload date

**Loading**
- "Load More" button or infinite scroll with fade-in animation

### Contact (`/contact`)

**Header**
- "CONTACT" text reveal

**Layout**
- Centered, minimal, lots of breathing room

**Social Links**
- Large, prominent icons in a horizontal row
- Glow/pulse hover effect in accent color
- Platforms managed in Sanity (add/remove without code)

**Direct Contact**
- Email (mailto: link) and phone (tel: link)
- Clean typography

**Tagline**
- Short line above links (e.g., "Get in touch")

## Responsiveness

- Fully responsive across all breakpoints
- Masonry grid, event cards, and team cards adapt gracefully
- Video hero falls back to static image on mobile/slow connections
- Mobile nav: full-screen hamburger overlay

## No Audio

- No auto-playing audio anywhere
- Video backgrounds are muted
