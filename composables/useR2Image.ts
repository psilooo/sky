/**
 * Returns the image URL as-is if it exists, or an empty string.
 * Images are served directly from R2 CDN — no transformations needed.
 */
export function useR2Image() {
  function imageUrl(url: string | null | undefined): string {
    return url || ''
  }

  return { imageUrl }
}
