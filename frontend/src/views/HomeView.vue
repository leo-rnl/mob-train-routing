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
  <div class="home-layout">
    <!-- Left panel: Form -->
    <main class="home-layout__main">
      <div class="home-layout__main-content">
        <h1 class="text-h5 font-weight-bold mb-6">Calculer un trajet</h1>
        <RouteForm :prefill="prefillData" @route-calculated="handleRouteCalculated" />
      </div>
    </main>

    <!-- Right aside: Route cards -->
    <aside class="home-layout__aside">
      <div class="home-layout__aside-content">
        <h2 class="text-h6 font-weight-bold mb-4">
          Historique des trajets
          <span v-if="meta?.total" class="routes-count">({{ meta.total }})</span>
        </h2>

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
          <v-btn variant="outlined" color="primary" @click="loadMore">Charger plus</v-btn>
        </div>

        <!-- Empty state -->
        <div
          v-if="routes.length === 0 && !lastCalculated && !isLoading"
          class="empty-state text-center pa-8"
        >
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-train-variant</v-icon>
          <div class="text-h6 text-medium-emphasis">Aucun trajet</div>
          <div class="text-body-2 text-medium-emphasis">
            Calculez votre premier trajet pour le voir apparaître ici.
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
  .home-layout {
    display: flex;
    min-height: calc(100vh - 64px); /* Subtract app bar height */
  }

  /* Left panel - Form */
  .home-layout__main {
    flex: 0 0 50%;
    max-width: 600px;
    min-width: 400px;
    background-color: rgb(var(--v-theme-surface));
    border-right: 1px solid rgba(0, 0, 0, 0.06);
  }

  .home-layout__main-content {
    padding: 30px;
    position: sticky;
    top: 64px; /* App bar height */
  }

  /* Right aside - Route cards */
  .home-layout__aside {
    flex: 1;
    background-color: #f5f5f5;
    overflow-y: auto;
  }

  .home-layout__aside-content {
    padding: 30px;
  }

  .empty-state {
    background-color: rgb(var(--v-theme-surface));
    border: 1px dashed rgba(0, 0, 0, 0.12);
  }

  .routes-count {
    font-weight: 400;
    color: #737885;
  }

  /* Responsive: stack on mobile */
  @media (max-width: 960px) {
    .home-layout {
      flex-direction: column;
    }

    .home-layout__main {
      flex: none;
      max-width: 100%;
      min-width: 100%;
    }

    .home-layout__main-content {
      padding: 20px;
    }

    .home-layout__aside-content {
      padding: 20px;
    }
  }
</style>
