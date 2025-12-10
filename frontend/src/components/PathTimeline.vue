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

  function isTerminus(index: number): boolean {
    return index === 0 || index === displayedPath.value.length - 1
  }
</script>

<template>
  <div class="path-timeline">
    <div class="timeline">
      <div
        v-for="(station, index) in displayedPath"
        :key="`${station}-${index}`"
        class="timeline__item"
      >
        <!-- Dot (decorative) -->
        <div
          class="timeline__dot"
          :class="{ 'timeline__dot--terminus': isTerminus(index) }"
          aria-hidden="true"
        />

        <!-- Line (decorative, not on last item) -->
        <div v-if="index < displayedPath.length - 1" class="timeline__line" aria-hidden="true" />

        <!-- Station info -->
        <div class="timeline__content">
          <span class="timeline__name" :class="{ 'timeline__name--terminus': isTerminus(index) }">
            {{ getStationName(station) }}
          </span>
          <span class="timeline__code">{{ station }}</span>
        </div>
      </div>
    </div>

    <button
      v-if="hasMiddleStations"
      class="timeline__toggle"
      :aria-expanded="isExpanded"
      :aria-label="
        isExpanded
          ? 'Réduire la liste des arrêts'
          : `Afficher ${hiddenCount} arrêt(s) intermédiaire(s)`
      "
      @click="toggleExpand"
    >
      {{ isExpanded ? 'Réduire' : `+ ${hiddenCount} arrêt(s)` }}
    </button>
  </div>
</template>

<style scoped>
  .path-timeline {
    padding: 4px 0;
  }

  .timeline {
    position: relative;
  }

  .timeline__item {
    display: flex;
    align-items: flex-start;
    position: relative;
    padding-left: 20px;
    min-height: 36px;
  }

  .timeline__dot {
    position: absolute;
    left: 1px;
    top: 6px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #737885;
    z-index: 1;
  }

  .timeline__dot--terminus {
    width: 8px;
    height: 8px;
    top: 5px;
    left: 0;
    background: white;
    border: 2px solid #2f3137;
  }

  .timeline__line {
    position: absolute;
    left: 3px;
    top: 12px;
    height: 24px;
    width: 2px;
    background: #e0e0e0;
  }

  .timeline__dot--terminus + .timeline__line {
    top: 13px;
  }

  .timeline__content {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding-bottom: 16px;
  }

  .timeline__name {
    font-size: 14px;
    color: #2f3137;
  }

  .timeline__name--terminus {
    font-weight: 600;
  }

  .timeline__code {
    font-size: 12px;
    color: #737885;
  }

  .timeline__toggle {
    margin-top: 4px;
    margin-left: 24px;
    padding: 4px 0;
    font-size: 13px;
    color: rgb(var(--v-theme-primary));
    background: none;
    border: none;
    cursor: pointer;
  }

  .timeline__toggle:hover {
    text-decoration: underline;
  }

  .timeline__toggle:focus-visible {
    outline: 2px solid #0c0d19;
    outline-offset: 2px;
  }
</style>
