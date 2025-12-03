<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { stationsApi, routesApi } from '@/services/api'
  import type { Station, Route } from '@/types/api'

  const emit = defineEmits<{
    (e: 'route-calculated', route: Route, stations: Map<string, Station>): void
  }>()

  // Form state
  const fromStation = ref<string | null>(null)
  const toStation = ref<string | null>(null)
  const analyticCode = ref('')

  // Autocomplete state
  const fromSearch = ref('')
  const toSearch = ref('')
  const fromStations = ref<Station[]>([])
  const toStations = ref<Station[]>([])
  const isLoadingFrom = ref(false)
  const isLoadingTo = ref(false)

  // Submit state
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  // Station cache for path display
  const stationsCache = new Map<string, Station>()

  // Debounce helper
  function debounce<T extends (...args: Parameters<T>) => void>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn(...args), delay)
    }
  }

  // Fetch stations with debounce
  const fetchFromStations = debounce(async (query: string) => {
    if (!query || query.length < 2) {
      fromStations.value = []
      return
    }
    isLoadingFrom.value = true
    try {
      const { data } = await stationsApi.list({ search: query })
      fromStations.value = data.items
      data.items.forEach((s) => stationsCache.set(s.shortName, s))
    } finally {
      isLoadingFrom.value = false
    }
  }, 300)

  const fetchToStations = debounce(async (query: string) => {
    if (!query || query.length < 2) {
      toStations.value = []
      return
    }
    isLoadingTo.value = true
    try {
      const { data } = await stationsApi.list({ search: query })
      toStations.value = data.items
      data.items.forEach((s) => stationsCache.set(s.shortName, s))
    } finally {
      isLoadingTo.value = false
    }
  }, 300)

  watch(fromSearch, (val) => fetchFromStations(val))
  watch(toSearch, (val) => fetchToStations(val))

  // Form validation
  const isFormValid = ref(false)
  function validateForm() {
    isFormValid.value = !!(fromStation.value && toStation.value && analyticCode.value.trim())
  }
  watch([fromStation, toStation, analyticCode], validateForm)

  // Submit handler
  async function handleSubmit() {
    if (!isFormValid.value || !fromStation.value || !toStation.value) return

    isSubmitting.value = true
    error.value = null

    try {
      const { data } = await routesApi.create({
        fromStationId: fromStation.value,
        toStationId: toStation.value,
        analyticCode: analyticCode.value.trim(),
      })

      emit('route-calculated', data, stationsCache)

      // Reset form
      fromStation.value = null
      toStation.value = null
      analyticCode.value = ''
      fromStations.value = []
      toStations.value = []
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
        <v-autocomplete
          v-model="fromStation"
          v-model:search="fromSearch"
          :items="fromStations"
          :loading="isLoadingFrom"
          item-title="longName"
          item-value="shortName"
          label="Station de départ"
          prepend-inner-icon="mdi-train"
          variant="outlined"
          no-filter
          clearable
          class="mb-2"
        />

        <v-autocomplete
          v-model="toStation"
          v-model:search="toSearch"
          :items="toStations"
          :loading="isLoadingTo"
          item-title="longName"
          item-value="shortName"
          label="Station d'arrivée"
          prepend-inner-icon="mdi-flag-checkered"
          variant="outlined"
          no-filter
          clearable
          class="mb-2"
        />

        <v-text-field
          v-model="analyticCode"
          label="Code analytique"
          prepend-inner-icon="mdi-tag"
          variant="outlined"
          class="mb-4"
        />

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
      </v-form>
    </v-card-text>
  </v-card>
</template>
