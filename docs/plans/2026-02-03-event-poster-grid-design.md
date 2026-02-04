# Event Poster Grid Design

> Redesign the events page from stacked horizontal cards to a 3-column poster grid with "expand below row" detail panels.

---

## Overview

The events page (`/events`) currently displays events as full-width horizontal cards stacked vertically. This redesign changes the events page to show **portrait poster images** (1349x1685) in a **3-column grid**, with expanded event details appearing **below the row** when clicked (Google Images style).

The home page `EventsTeaser` component is **not affected** — it keeps its horizontal `featuredImage` layout.

---

## Data Layer

### New Sanity Schema Field

Add a `poster` field (type: `string`, R2 image URL) to the `event` document schema in the Sanity Studio.

- `featuredImage` — horizontal image, used by `EventsTeaser` (home page)
- `poster` — vertical poster image (1349x1685), used by events page grid

### GROQ Query Change

In `pages/events.vue`, add `poster` to the field selection:

```groq
*[_type == "event"] | order(date desc) {
  _id, title, date, venue, location, description, featuredImage, poster, gallery, videoUrl, lineup
}
```

### Fallback

If an event has no `poster` set, the events page grid falls back to displaying `featuredImage`.

---

## Events Page Grid Layout

### Grid Structure

- **Mobile:** `grid-cols-1` (single column)
- **Desktop (md+):** `grid-cols-3` (3 columns)
- **Gap:** `gap-6`

### Expand Below Row

When a poster card is clicked:

1. Determine which row the card is in: `rowIndex = Math.floor(cardIndex / 3)`
2. Insert an expansion panel after the last card in that row
3. The panel spans all 3 columns (`grid-column: 1 / -1`)
4. Only one event can be expanded at a time

Implementation approach: render cards in the grid, and after each complete row (every 3 cards, or after the last card in an incomplete row), conditionally render the detail panel if the expanded event is in that row.

---

## Poster Card (Collapsed State)

- **Aspect ratio:** `1349/1685` (portrait)
- **Image:** `poster` field (fallback to `featuredImage`)
- **Default state:** Poster fills the card, no text overlay
- **Hover state:**
  - Gradient overlay fades in from bottom (`opacity-0` -> `group-hover:opacity-100`, `transition-opacity duration-300`)
  - Event title and date appear within the gradient
  - Subtle card scale: `group-hover:scale-[1.02]` over `duration-500`
- **Border:** `border-white/5`, hover: `border-accent/30` with glow
- **Rounded corners:** `rounded-lg`

---

## Expanded Detail Panel

Appears below the row, spanning all 3 grid columns. Contains:

1. **Featured image banner** — the horizontal `featuredImage` at the top for context
2. **Event info** — title, date, venue, location
3. **Description** — rendered via `SanityContent` (Portable Text)
4. **Lineup** — pill-style tags
5. **Gallery** — grid of thumbnail images
6. **Video** — iframe embed
7. **Close button**

Same content as the current `EventCard` expanded section, restructured for the full-width panel.

---

## Animations

### Poster Hover

- CSS transitions only (no GSAP needed)
- Gradient + text: `opacity 0 -> 1`, `duration-300`
- Card scale: `scale-100 -> scale-[1.02]`, `duration-500`

### Expansion Panel

- **Open:** GSAP `height: 0 -> auto`, `opacity: 0 -> 1`, `0.6s`, `power2.out`
- **Close:** GSAP `height -> 0`, `opacity -> 0`, `0.3s`, `power2.in`
- **Switch:** Close current (0.3s), then open new (0.6s) — sequential

### Scroll Behavior

- After expansion animation completes, scroll the detail panel into view if off-screen (GSAP `scrollTo`)
- Deep linking (`?event=id`) still works: auto-expand + scroll on mount

### Page Load

- `useStaggerReveal` on `.event-item` grid items (same as current)

---

## Files to Modify

| File | Change |
|------|--------|
| `pages/events.vue` | Grid layout, row-based expansion logic, detail panel template |
| `components/EventCard.vue` | Simplify to poster-only thumbnail (remove inline expansion) |
| Sanity Studio: `event` schema | Add `poster` string field |
| GROQ query in `events.vue` | Add `poster` to field selection |

## Files NOT Modified

| File | Reason |
|------|--------|
| `components/EventsTeaser.vue` | Home page stays horizontal |
| All other components/pages | No impact |

---

## Responsive Behavior

| Breakpoint | Columns | Card Size |
|------------|---------|-----------|
| < 768px (mobile) | 1 | Full width |
| >= 768px (md, desktop) | 3 | ~1/3 container width |

The `max-w-5xl` container (~1024px) is kept, so each poster card in the 3-column grid is roughly 320px wide, which at 1349:1685 ratio gives a height of ~400px — a good visual size.
