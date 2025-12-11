<script setup lang="ts">
  const error = defineModel<string | null>({ required: true })
</script>

<template>
  <v-alert
    v-if="error"
    type="error"
    variant="tonal"
    closable
    role="alert"
    aria-live="polite"
    @click:close="error = null"
  >
    {{ error }}
  </v-alert>
</template>
