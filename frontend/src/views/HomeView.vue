<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import RouteForm from '@/components/RouteForm.vue'
  import RouteCard from '@/components/RouteCard.vue'
  import { routesApi } from '@/services/api'
  import type { Route, PaginationMeta } from '@/types/api'

  // Routes state
  const routes = ref<Route[]>([])
  const meta = ref<PaginationMeta | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Last calculated route in this session (highlighted)
  const lastCalculated = ref<Route | null>(null)

  // Pre-fill data for RouteForm
  const prefillData = ref<{ from?: string; to?: string; code?: string } | null>(null)

  // Pagination
  const currentPage = ref(1)
  const perPage = 10

  const hasMore = computed(() => {
    if (!meta.value) return false
    return meta.value.current_page < meta.value.last_page
  })

  // Previous routes (excluding the last calculated one)
  const previousRoutes = computed(() => {
    if (!lastCalculated.value) return routes.value
    return routes.value.filter((r) => r.id !== lastCalculated.value?.id)
  })

  async function fetchRoutes(page = 1, append = false) {
    isLoading.value = true
    error.value = null

    try {
      const { data } = await routesApi.list({ page, per_page: perPage })

      if (append) {
        routes.value = [...routes.value, ...data.data]
      } else {
        routes.value = data.data
      }

      meta.value = data.meta
      currentPage.value = data.meta.current_page
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      error.value = err.response?.data?.message || 'Erreur lors du chargement des trajets'
    } finally {
      isLoading.value = false
    }
  }

  function handleRouteCalculated(routeData: Route) {
    // Set as highlighted
    lastCalculated.value = routeData

    // Add to the beginning of routes list if not already there
    const existingIndex = routes.value.findIndex((r) => r.id === routeData.id)
    if (existingIndex === -1) {
      routes.value.unshift(routeData)
    }

    // Clear pre-fill
    prefillData.value = null
  }

  function handleUseRoute(route: Route) {
    prefillData.value = {
      from: route.fromStationId,
      to: route.toStationId,
      code: route.analyticCode,
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function loadMore() {
    if (hasMore.value) {
      fetchRoutes(currentPage.value + 1, true)
    }
  }

  onMounted(() => fetchRoutes())
</script>

<template>
  <v-container>
    <!-- Form section - wider -->
    <v-row justify="center">
      <v-col cols="12" lg="10">
        <RouteForm :prefill="prefillData" class="mb-6" @route-calculated="handleRouteCalculated" />
      </v-col>
    </v-row>

    <!-- Routes list section - narrower -->
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-alert v-if="error" type="error" variant="tonal" closable @click:close="error = null">
          {{ error }}
        </v-alert>

        <!-- Last calculated route (highlighted) -->
        <RouteCard v-if="lastCalculated" :route="lastCalculated" highlight />

        <!-- Previous routes -->
        <RouteCard
          v-for="route in previousRoutes"
          :key="route.id"
          :route="route"
          @use="handleUseRoute"
        />

        <!-- Loading indicator -->
        <v-progress-linear v-if="isLoading" indeterminate color="primary" class="mt-4" />

        <!-- Load more button -->
        <div v-if="hasMore && !isLoading" class="text-center mt-4">
          <v-btn variant="outlined" color="primary" @click="loadMore"> Charger plus </v-btn>
        </div>

        <!-- Empty state (only if no routes and no lastCalculated) -->
        <div
          v-if="routes.length === 0 && !lastCalculated && !isLoading"
          class="text-center pa-8 mt-4"
        >
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-train-variant</v-icon>
          <div class="text-h6 text-medium-emphasis">Calculez votre premier trajet</div>
          <div class="text-body-2 text-medium-emphasis">
            Sélectionnez les stations de départ et d'arrivée ci-dessus.
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
