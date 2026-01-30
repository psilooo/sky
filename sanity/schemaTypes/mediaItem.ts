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
