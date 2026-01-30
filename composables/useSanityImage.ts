import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

export function useSanityImageUrl() {
  const { projectId, dataset } = useSanity().client.config()

  function urlFor(source: SanityImageSource) {
    return imageUrlBuilder({ projectId: projectId!, dataset: dataset! }).image(source)
  }

  return { urlFor }
}
