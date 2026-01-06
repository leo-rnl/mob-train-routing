<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { useStationsStore } from '@/stores/stations'
  import { useAnalyticCode } from '@/composables/useAnalyticCode'
  import { useStationFilter } from '@/composables/useStationFilter'
  import { useRouteCalculation } from '@/composables/useRouteCalculation'
  import ErrorAlert from '@/components/ErrorAlert.vue'
  import type { Route } from '@/types/api'

  const props = defineProps<{
    prefill?: { from?: string; to?: string; code?: string } | null
  }>()

  const emit = defineEmits<{
    (e: 'route-calculated', route: Route): void
  }>()

  const stationsStore = useStationsStore()
  const analyticCodeStorage = useAnalyticCode()
  const routeCalculation = useRouteCalculation()

  // Form state
  const fromStation = ref<string | null>(null)
  const toStation = ref<string | null>(null)
  const analyticCode = ref('')

  // Autocomplete search state
  const fromSearch = ref('')
  const toSearch = ref('')

  // Station filtering via composables
  const { filteredStations: fromStations } = useStationFilter({
    stations: computed(() => stationsStore.stationsList),
    search: fromSearch,
    selected: fromStation,
  })

  const { filteredStations: toStations } = useStationFilter({
    stations: computed(() => stationsStore.stationsList),
    search: toSearch,
    selected: toStation,
  })

  // Watch prefill prop to pre-fill form fields
  watch(
    () => props.prefill,
    (prefill) => {
      if (prefill) {
        if (prefill.from) {
          fromStation.value = prefill.from
          fromSearch.value = stationsStore.getStationName(prefill.from)
        }
        if (prefill.to) {
          toStation.value = prefill.to
          toSearch.value = stationsStore.getStationName(prefill.to)
        }
        if (prefill.code) {
          analyticCode.value = prefill.code
        }
      }
    },
    { immediate: true }
  )

  // Form validation
  const isFormValid = computed(
    () => !!(fromStation.value && toStation.value && analyticCode.value.trim())
  )

  // Load persisted analytic code on mount
  onMounted(() => {
    const savedCode = analyticCodeStorage.load()
    if (savedCode && !analyticCode.value) {
      analyticCode.value = savedCode
    }
  })

  // Swap departure and destination stations
  function swapStations() {
    const tempStation = fromStation.value
    const tempSearch = fromSearch.value

    fromStation.value = toStation.value
    fromSearch.value = toSearch.value

    toStation.value = tempStation
    toSearch.value = tempSearch
  }

  // Submit handler
  async function handleSubmit() {
    if (!isFormValid.value || !fromStation.value || !toStation.value) return

    const code = analyticCode.value.trim()

    const route = await routeCalculation.calculate({
      fromStationId: fromStation.value,
      toStationId: toStation.value,
      analyticCode: code,
    })

    if (route) {
      // Persist analytic code
      analyticCodeStorage.save(code)

      // Emit the calculated route
      emit('route-calculated', route)

      // Reset form (keep analytic code)
      fromStation.value = null
      toStation.value = null
      fromSearch.value = ''
      toSearch.value = ''
    }
  }
</script>

<template>
  <div class="route-form">
    <v-alert
      v-if="stationsStore.error"
      type="error"
      variant="tonal"
      class="mb-4"
      role="alert"
      aria-live="polite"
    >
      {{ stationsStore.error }}
    </v-alert>

    <ErrorAlert v-model="routeCalculation.error.value" class="mb-4" />

    <v-form @submit.prevent="handleSubmit">
      <!-- Station inputs with timeline -->
      <div class="stations-group">
        <!-- Timeline connector -->
        <div class="stations-timeline">
          <div class="timeline-dot" />
          <div class="timeline-line" />
          <div class="timeline-dot timeline-dot--filled" />
        </div>

        <!-- Station inputs -->
        <div class="stations-inputs">
          <v-autocomplete
            v-model="fromStation"
            v-model:search="fromSearch"
            :items="fromStations"
            :loading="stationsStore.isLoading"
            item-title="longName"
            item-value="shortName"
            label="Gare de départ"
            variant="outlined"
            no-filter
            clearable
            density="comfortable"
            hide-details
            class="mb-3"
          />

          <v-autocomplete
            v-model="toStation"
            v-model:search="toSearch"
            :items="toStations"
            :loading="stationsStore.isLoading"
            item-title="longName"
            item-value="shortName"
            label="Gare de destination"
            variant="outlined"
            no-filter
            clearable
            density="comfortable"
            hide-details
          />
        </div>

        <!-- Swap button -->
        <v-btn
          variant="flat"
          class="swap-btn"
          :disabled="!fromStation && !toStation"
          aria-label="Inverser les gares de départ et d'arrivée"
          @click="swapStations"
        >
          <v-icon aria-hidden="true">mdi-swap-vertical</v-icon>
        </v-btn>
      </div>

      <!-- Separator -->
      <v-divider class="my-6" />

      <!-- Analytic code -->
      <v-text-field
        v-model="analyticCode"
        label="Code analytique"
        prepend-inner-icon="mdi-tag"
        variant="outlined"
        density="comfortable"
        class="mb-0"
      />

      <!-- Submit button -->
      <v-btn
        type="submit"
        color="primary"
        block
        size="large"
        :loading="routeCalculation.isSubmitting.value"
        :disabled="!isFormValid || routeCalculation.isSubmitting.value"
      >
        Calculer le trajet
      </v-btn>
    </v-form>
  </div>
</template>

<style scoped>
  .stations-group {
    display: flex;
    align-items: stretch;
    gap: 16px;
  }

  /* Timeline on the left */
  .stations-timeline {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 14px 0;
    width: 20px;
    flex-shrink: 0;
  }

  .timeline-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid rgb(var(--v-theme-on-surface));
    background-color: transparent;
    flex-shrink: 0;
  }

  .timeline-dot--filled {
    background-color: rgb(var(--v-theme-on-surface));
  }

  .timeline-line {
    flex: 1;
    width: 2px;
    background-color: rgb(var(--v-theme-on-surface));
    margin: 4px 0;
  }

  /* Station inputs */
  .stations-inputs {
    flex: 1;
  }

  /* Swap button */
  .swap-btn {
    align-self: stretch;
    min-width: 48px !important;
    height: auto !important;
    background-color: #f0f0f0 !important;
    color: rgb(var(--v-theme-on-surface)) !important;
  }

  .swap-btn:hover {
    background-color: #e0e0e0 !important;
  }
</style>
