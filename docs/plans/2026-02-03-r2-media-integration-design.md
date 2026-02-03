# R2 Media Integration Design

## Overview

Replace Sanity's built-in asset storage with Cloudflare R2 for all media hosting. Add a Media Library tool to Sanity Studio for managing R2 assets, and a custom image input component so all image fields use R2 URLs instead of Sanity image references.

## Architecture

```
Sanity Studio  -->  Cloudflare Worker  -->  R2 Bucket
(upload/list/delete)                        (stores files)
     |                                          |
     v                                          v
  Stores R2 URL                          Public domain serves
  in Sanity document                     images directly via CDN
     |
     v
  Nuxt Frontend
  reads URL string from Sanity,
  displays with CSS/HTML sizing
```

## Components

### 1. Cloudflare Worker

API sitting in front of R2, protected by API key in `Authorization` header.

**Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/upload` | Upload file. Accepts multipart form data with `file` and `category`. Returns public URL. |
| `GET` | `/list` | List files. Optional `?category=events` filter. Returns `[{ url, filename, category, size, uploaded }]`. |
| `DELETE` | `/delete` | Delete file. Accepts `{ key }` in body. |

**File naming:** `{category}/{timestamp}-{sanitized-original-filename}`
Example: `events/1738590000-summer-fest-hero.jpg`

**Security:** API key required for all endpoints. Public read access via R2 custom domain.

### 2. Sanity Studio — Media Library Tool

Custom tool in the studio sidebar alongside "Content".

**Layout:**
- Category filter tabs: All / Events / Team / General
- Search box filtering by filename
- Drag-and-drop upload zone with category selector
- Thumbnail grid of all R2 images with filename and size
- Multi-select + delete with confirmation dialog

**File structure in studio:**
```
plugins/
  mediaLibrary/
    index.ts              (plugin definition)
    MediaLibraryTool.tsx   (main React component)
    api.ts                 (Worker API client)
```

### 3. Sanity Studio — Custom Image Input Component

Replaces Sanity's default image field. Stores a URL string instead of a Sanity image reference.

**Behavior:**
- Displays thumbnail preview of current image (if set)
- "Browse Media" button opens modal with the same grid browser as the Media Library tool
- Client can select an existing image or upload a new one in the modal
- On selection, R2 URL is written to the field
- "Remove" button clears the field

**Shared components** between the Media Library tool and the image input modal to avoid duplication.

### 4. Schema Changes

All `image` type fields become `string` type fields with the custom R2 input component.

**Affected schemas:**
- `event.ts`: `featuredImage`, `gallery` (array of images -> array of strings)
- `mediaItem.ts`: `image`, `videoThumbnail`
- `teamMember.ts`: `photo`
- `siteSettings.ts`: `heroFallbackImage`, `aboutHeroImage`, embedded images in `aboutStory` portable text

**Helper type:** A reusable `r2Image` field definition to avoid repeating component config.

**Lost:** Sanity hotspot/crop tool (CSS `object-fit: cover` handles this instead).
**Kept:** Alt text and captions can be added as sibling string fields where needed.

### 5. Frontend Changes (Nuxt)

**Remove:** `@sanity/image-url` dependency and `composables/useSanityImage.ts`

**Add:** `composables/useR2Image.ts` — simple helper that handles null/undefined URLs. No image transformations; images served as originals from R2 CDN, sized via HTML/CSS.

**Update components:**
- `EventCard.vue` — swap `urlFor()` calls for raw R2 URLs
- `MediaGrid.vue` — same
- `MediaHighlight.vue` — same
- `MediaLightbox.vue` — same
- `HeroSection.vue` — same
- `TeamCard.vue` — same
- `SanityContent.vue` — handle embedded images in portable text

**GROQ queries unchanged** — same field names, just return strings instead of image reference objects.

### 6. R2 Bucket Structure

```
sky-events-media/
  events/
    1738590000-summer-fest-hero.jpg
    1738590001-summer-fest-gallery-01.jpg
  team/
    1738590100-john-doe.jpg
  general/
    1738590200-hero-fallback.jpg
    1738590201-about-hero.jpg
```

### 7. Environment Configuration

**Cloudflare (manual setup):**
- R2 bucket with public access via custom domain
- Worker deployed with `API_KEY` secret and R2 bucket binding

**Sanity Studio `.env`:**
```
SANITY_STUDIO_R2_WORKER_URL=https://r2-api.skyeventsasia.com
SANITY_STUDIO_R2_API_KEY=your-api-key
```

**Nuxt frontend:**
- No secrets needed — reads plain URLs from Sanity documents

## Implementation Order

1. Cloudflare Worker (API for R2 operations)
2. Sanity plugin — shared media browser component
3. Sanity plugin — Media Library sidebar tool
4. Sanity plugin — Custom R2 image input component
5. Schema changes (swap image fields to string + custom input)
6. Frontend composable + component updates
7. Clean up old Sanity image utilities
