<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { routesApi } from '@/services/api'
  import { useStationsStore } from '@/stores/stations'
  import type { Route } from '@/types/api'

  const LAST_ANALYTIC_CODE_KEY = 'last_analytic_code'

  const props = defineProps<{
    prefill?: { from?: string; to?: string; code?: string } | null
  }>()

  const emit = defineEmits<{
    (e: 'route-calculated', route: Route): void
  }>()

  const stationsStore = useStationsStore()

  // Form state
  const fromStation = ref<string | null>(null)
  const toStation = ref<string | null>(null)
  const analyticCode = ref('')

  // Autocomplete search state
  const fromSearch = ref('')
  const toSearch = ref('')

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

  // Default stations to show when no search (first 5)
  const DEFAULT_STATIONS_COUNT = 5

  // Computed filtered lists based on search (local filtering from store)
  // Always include the selected station to ensure Vuetify can display its longName
  const fromStations = computed(() => {
    const search = fromSearch.value.toLowerCase()
    let results: typeof stationsStore.stationsList

    if (!search || search.length < 2) {
      results = stationsStore.stationsList.slice(0, DEFAULT_STATIONS_COUNT)
    } else {
      results = stationsStore.stationsList.filter(
        (s) =>
          s.shortName.toLowerCase().includes(search) || s.longName.toLowerCase().includes(search)
      )
    }

    // Ensure selected station is always in the list
    if (fromStation.value) {
      const selectedInResults = results.some((s) => s.shortName === fromStation.value)
      if (!selectedInResults) {
        const selected = stationsStore.stationsList.find((s) => s.shortName === fromStation.value)
        if (selected) results = [selected, ...results]
      }
    }

    return results
  })

  const toStations = computed(() => {
    const search = toSearch.value.toLowerCase()
    let results: typeof stationsStore.stationsList

    if (!search || search.length < 2) {
      results = stationsStore.stationsList.slice(0, DEFAULT_STATIONS_COUNT)
    } else {
      results = stationsStore.stationsList.filter(
        (s) =>
          s.shortName.toLowerCase().includes(search) || s.longName.toLowerCase().includes(search)
      )
    }

    // Ensure selected station is always in the list
    if (toStation.value) {
      const selectedInResults = results.some((s) => s.shortName === toStation.value)
      if (!selectedInResults) {
        const selected = stationsStore.stationsList.find((s) => s.shortName === toStation.value)
        if (selected) results = [selected, ...results]
      }
    }

    return results
  })

  // Submit state
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  // Form validation
  const isFormValid = computed(
    () => !!(fromStation.value && toStation.value && analyticCode.value.trim())
  )

  // Load persisted analytic code on mount
  onMounted(() => {
    const savedCode = localStorage.getItem(LAST_ANALYTIC_CODE_KEY)
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

    isSubmitting.value = true
    error.value = null

    try {
      const code = analyticCode.value.trim()

      const { data } = await routesApi.create({
        fromStationId: fromStation.value,
        toStationId: toStation.value,
        analyticCode: code,
      })

      // Persist analytic code
      localStorage.setItem(LAST_ANALYTIC_CODE_KEY, code)

      // Emit the calculated route
      emit('route-calculated', data)

      // Reset form (keep analytic code)
      fromStation.value = null
      toStation.value = null
      fromSearch.value = ''
      toSearch.value = ''
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      error.value = err.response?.data?.message || 'Erreur lors du calcul du trajet'
    } finally {
      isSubmitting.value = false
    }
  }
</script>

<template>
  <div class="route-form">
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      role="alert"
      aria-live="polite"
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>

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
        :loading="isSubmitting"
        :disabled="!isFormValid || isSubmitting"
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
