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
