<script setup lang="ts">
import { PortableText } from '@portabletext/vue'

defineProps<{ blocks: any[] }>()
</script>

<template>
  <PortableText :value="blocks" />
</template>
