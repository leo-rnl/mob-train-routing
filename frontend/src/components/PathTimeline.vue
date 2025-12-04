<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useStationsStore } from '@/stores/stations'

  const props = defineProps<{
    path: string[]
    initialExpanded?: boolean
  }>()

  const stationsStore = useStationsStore()
  const isExpanded = ref(props.initialExpanded ?? false)

  const displayedPath = computed(() => {
    if (isExpanded.value || props.path.length <= 2) {
      return props.path
    }
    // Collapsed: show only first and last
    return [props.path[0], props.path[props.path.length - 1]]
  })

  const hasMiddleStations = computed(() => props.path.length > 2)

  const hiddenCount = computed(() => props.path.length - 2)

  function toggleExpand() {
    isExpanded.value = !isExpanded.value
  }

  function getStationName(shortName: string): string {
    return stationsStore.getStationName(shortName)
  }

  function getDotColor(index: number): string {
    if (index === 0) return 'success'
    if (index === displayedPath.value.length - 1) return 'error'
    return 'grey'
  }

  function getIcon(index: number): string | undefined {
    if (index === 0) return 'mdi-train'
    if (index === displayedPath.value.length - 1) return 'mdi-flag-checkered'
    return undefined
  }
</script>

<template>
  <div class="path-timeline">
    <v-timeline density="compact" side="end">
      <v-timeline-item
        v-for="(station, index) in displayedPath"
        :key="`${station}-${index}`"
        :dot-color="getDotColor(index)"
        :icon="getIcon(index)"
        size="small"
      >
        <div class="text-body-2">{{ getStationName(station) }}</div>
        <div class="text-caption text-medium-emphasis">{{ station }}</div>
      </v-timeline-item>
    </v-timeline>

    <v-btn
      v-if="hasMiddleStations"
      variant="text"
      size="small"
      color="primary"
      class="mt-2"
      @click="toggleExpand"
    >
      <v-icon start>{{ isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      {{ isExpanded ? 'Réduire' : `Afficher ${hiddenCount} station(s) intermédiaire(s)` }}
    </v-btn>
  </div>
</template>
