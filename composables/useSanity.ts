import { createClient } from '@sanity/client'

export function groq(strings: TemplateStringsArray, ...values: unknown[]): string {
  return String.raw({ raw: strings }, ...values)
}

export function useSanityClient() {
  const config = useRuntimeConfig()
  const { projectId, dataset, apiVersion } = config.public.sanity

  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
  })
}

export function useSanityQuery<T = unknown>(query: string, params?: Record<string, unknown>) {
  const client = useSanityClient()
  return useAsyncData<T>(query, () => client.fetch<T>(query, params ?? {}))
}
