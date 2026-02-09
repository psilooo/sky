<script setup lang="ts">
const query = groq`*[_type == "siteSettings"][0]{ favicon, ogImage, ogDescription }`
const { data: settings } = await useSanityQuery(query)

useHead({
  link: computed(() =>
    settings.value?.favicon
      ? [{ rel: 'icon', type: 'image/png', href: settings.value.favicon }]
      : []
  ),
})

useSeoMeta({
  ogImage: () => settings.value?.ogImage || '',
  ogDescription: () => settings.value?.ogDescription || '',
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
