<script setup lang="ts">
  import { ref, computed } from 'vue'
  import PathTimeline from '@/components/PathTimeline.vue'
  import { useStationsStore } from '@/stores/stations'
  import type { Route } from '@/types/api'

  const props = withDefaults(
    defineProps<{
      route: Route
      highlight?: boolean
    }>(),
    {
      highlight: false,
    }
  )

  const emit = defineEmits<{
    (e: 'use', route: Route): void
  }>()

  const stationsStore = useStationsStore()

  // Expand state - highlight routes start expanded
  const isExpanded = ref(props.highlight)

  const fromStationName = computed(() => stationsStore.getStationName(props.route.fromStationId))

  const toStationName = computed(() => stationsStore.getStationName(props.route.toStationId))

  const formattedDate = computed(() => {
    const date = new Date(props.route.createdAt)
    return date.toLocaleDateString('fr-CH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  })

  function toggleExpand() {
    isExpanded.value = !isExpanded.value
  }

  function handleUse() {
    emit('use', props.route)
  }
</script>

<template>
  <v-card
    :variant="highlight ? 'elevated' : 'outlined'"
    class="mb-4 route-card"
    :class="{ 'route-card--highlight': highlight }"
  >
    <v-card-title
      class="d-flex align-center justify-space-between flex-wrap ga-2 cursor-pointer"
      @click="toggleExpand"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-train</v-icon>
        <span>{{ fromStationName }}</span>
        <v-icon class="mx-2">mdi-arrow-right</v-icon>
        <span>{{ toStationName }}</span>
      </div>
      <div class="d-flex align-center ga-2">
        <v-chip size="small" color="primary" variant="tonal">
          {{ route.distanceKm.toFixed(2) }} km
        </v-chip>
        <v-icon>
          {{ isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
        </v-icon>
      </div>
    </v-card-title>

    <v-card-subtitle class="d-flex align-center ga-4 flex-wrap">
      <span>
        <v-icon size="small" class="mr-1">mdi-tag</v-icon>
        {{ route.analyticCode }}
      </span>
      <span>
        <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
        {{ formattedDate }}
      </span>
    </v-card-subtitle>

    <v-expand-transition>
      <v-card-text v-show="isExpanded">
        <PathTimeline :path="route.path" :initial-expanded="highlight" />
      </v-card-text>
    </v-expand-transition>

    <v-card-actions v-if="!highlight">
      <v-spacer />
      <v-btn variant="text" color="primary" prepend-icon="mdi-pencil" @click="handleUse">
        Utiliser
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
  .route-card .cursor-pointer {
    cursor: pointer;
  }

  .route-card--highlight {
    border: 2px solid rgb(var(--v-theme-primary));
    background: linear-gradient(
      135deg,
      rgba(var(--v-theme-primary), 0.04) 0%,
      rgba(var(--v-theme-primary), 0.08) 100%
    );
  }
</style>
