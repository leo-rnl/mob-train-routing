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
    class="route-card"
    :class="{
      'route-card--highlight': highlight,
      'route-card--focused': isExpanded,
    }"
  >
    <!-- Clickable header zone -->
    <div class="route-card__clickable" @click="toggleExpand">
      <!-- Header: Stations + Distance -->
      <div class="route-card__header">
        <div class="route-card__stations">
          <span class="route-card__station">{{ fromStationName }}</span>
          <v-icon size="small" class="route-card__arrow">mdi-arrow-right</v-icon>
          <span class="route-card__station">{{ toStationName }}</span>
        </div>
        <div class="route-card__distance">{{ route.distanceKm.toFixed(2) }} km</div>
      </div>

      <!-- Metadata: Code + Date + Stops -->
      <div class="route-card__meta">
        <span class="route-card__meta-item">
          <v-icon size="14" class="mr-1">mdi-tag-outline</v-icon>
          {{ route.analyticCode }}
        </span>
        <span class="route-card__meta-item">
          <v-icon size="14" class="mr-1">mdi-map-marker-path</v-icon>
          {{ route.path.length <= 2 ? 'Direct' : `${route.path.length - 2} arrêt(s)` }}
        </span>
        <span class="route-card__meta-item">
          <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
          {{ formattedDate }}
        </span>
      </div>
    </div>

    <!-- Expanded content (not clickable for toggle) -->
    <v-expand-transition>
      <div v-show="isExpanded" class="route-card__details">
        <PathTimeline :path="route.path" :initial-expanded="highlight" />

        <div v-if="!highlight" class="route-card__actions">
          <v-btn variant="text" color="primary" size="small" @click="handleUse">
            Utiliser ce trajet
          </v-btn>
        </div>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<style scoped>
  .route-card {
    margin-bottom: 12px;
    padding: 16px 20px;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border: 2px solid transparent;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .route-card__clickable {
    cursor: pointer;
  }

  .route-card__clickable:hover {
    opacity: 0.9;
  }

  .route-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .route-card--focused {
    border-color: #000;
  }

  .route-card--highlight {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.02);
  }

  .route-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 8px;
  }

  .route-card__stations {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 15px;
  }

  .route-card__station {
    color: #2f3137;
  }

  .route-card__arrow {
    color: #737885;
  }

  .route-card__distance {
    font-weight: 600;
    font-size: 15px;
    color: rgb(var(--v-theme-primary));
    white-space: nowrap;
  }

  .route-card__meta {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 13px;
    color: #737885;
  }

  .route-card__meta-item {
    display: flex;
    align-items: center;
  }

  .route-card__details {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #eee;
  }

  .route-card__actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
</style>
