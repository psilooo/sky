<script setup lang="ts">
defineProps<{ open: boolean; links: { label: string; to: string }[] }>()
defineEmits<{ close: [] }>()
const route = useRoute()
</script>

<template>
  <Transition name="menu">
    <div v-if="open" class="fixed inset-0 z-40 bg-dark flex flex-col items-center justify-center gap-8">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="font-display text-4xl tracking-widest uppercase transition-colors hover:text-accent"
        :class="route.path === link.to ? 'text-accent' : 'text-white'"
        @click="$emit('close')"
      >
        {{ link.label }}
      </NuxtLink>
    </div>
  </Transition>
</template>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.3s ease;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}
</style>
