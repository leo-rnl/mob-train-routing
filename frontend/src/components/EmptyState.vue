<script setup lang="ts">
  defineProps<{
    icon: string
    title: string
    subtitle?: string
  }>()
</script>

<template>
  <div class="empty-state text-center pa-8">
    <v-icon size="64" color="grey-lighten-1" class="mb-4" aria-hidden="true">
      {{ icon }}
    </v-icon>
    <div class="text-h6 text-medium-emphasis">{{ title }}</div>
    <div v-if="subtitle" class="text-body-2 text-medium-emphasis">
      {{ subtitle }}
    </div>
  </div>
</template>

<style scoped>
  .empty-state {
    background-color: rgb(var(--v-theme-surface));
    border: 1px dashed rgba(0, 0, 0, 0.12);
  }
</style>
