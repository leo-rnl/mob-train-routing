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
  const fromStations = computed(() => {
    const search = fromSearch.value.toLowerCase()
    if (!search || search.length < 2) {
      // Show first N stations by default
      return stationsStore.stationsList.slice(0, DEFAULT_STATIONS_COUNT)
    }
    return stationsStore.stationsList.filter(
      (s) => s.shortName.toLowerCase().includes(search) || s.longName.toLowerCase().includes(search)
    )
  })

  const toStations = computed(() => {
    const search = toSearch.value.toLowerCase()
    if (!search || search.length < 2) {
      // Show first N stations by default
      return stationsStore.stationsList.slice(0, DEFAULT_STATIONS_COUNT)
    }
    return stationsStore.stationsList.filter(
      (s) => s.shortName.toLowerCase().includes(search) || s.longName.toLowerCase().includes(search)
    )
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
  <v-card>
    <v-card-title>Calculer un trajet</v-card-title>

    <v-card-text>
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="error = null"
      >
        {{ error }}
      </v-alert>

      <v-form @submit.prevent="handleSubmit">
        <v-row align="center">
          <v-col cols="12" md="3">
            <v-autocomplete
              v-model="fromStation"
              v-model:search="fromSearch"
              :items="fromStations"
              :loading="stationsStore.isLoading"
              item-title="longName"
              item-value="shortName"
              label="Station de départ"
              prepend-inner-icon="mdi-train"
              variant="outlined"
              no-filter
              clearable
              hide-details
              density="comfortable"
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-autocomplete
              v-model="toStation"
              v-model:search="toSearch"
              :items="toStations"
              :loading="stationsStore.isLoading"
              item-title="longName"
              item-value="shortName"
              label="Station d'arrivée"
              prepend-inner-icon="mdi-flag-checkered"
              variant="outlined"
              no-filter
              clearable
              hide-details
              density="comfortable"
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-text-field
              v-model="analyticCode"
              label="Code analytique"
              prepend-inner-icon="mdi-tag"
              variant="outlined"
              hide-details
              density="comfortable"
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-btn
              type="submit"
              color="primary"
              block
              size="large"
              :loading="isSubmitting"
              :disabled="!isFormValid || isSubmitting"
            >
              Calculer
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
  </v-card>
</template>
