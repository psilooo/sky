<script setup lang="ts">
import { PortableText } from '@portabletext/vue'

defineProps<{ blocks: any[] }>()
</script>

<template>
  <PortableText v-if="blocks?.length" :value="blocks" />
</template>
