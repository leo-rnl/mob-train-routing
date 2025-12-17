<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import RouteForm from '@/components/RouteForm.vue'
  import RouteCard from '@/components/RouteCard.vue'
  import EmptyState from '@/components/EmptyState.vue'
  import ErrorAlert from '@/components/ErrorAlert.vue'
  import { routesApi } from '@/services/api'
  import { usePagination } from '@/composables/usePagination'
  import { useRouteHistory } from '@/composables/useRouteHistory'
  import { getApiErrorMessage } from '@/utils/errorUtils'
  import type { Route } from '@/types/api'

  // Composables
  const pagination = usePagination({ perPage: 10 })
  const history = useRouteHistory()

  // Local state
  const error = ref<string | null>(null)
  const prefillData = ref<{ from?: string; to?: string; code?: string } | null>(null)

  async function fetchRoutes(page = 1, append = false) {
    pagination.isLoading.value = true
    error.value = null

    try {
      const { data } = await routesApi.list({ page, per_page: pagination.perPage })

      if (append) {
        history.appendRoutes(data.data)
      } else {
        history.setRoutes(data.data)
      }

      pagination.setMeta(data.meta)
    } catch (e) {
      error.value = getApiErrorMessage(e, 'Erreur lors du chargement des trajets')
    } finally {
      pagination.isLoading.value = false
    }
  }

  function handleRouteCalculated(routeData: Route) {
    history.setLastCalculated(routeData)
    pagination.incrementTotal()
    prefillData.value = null
  }

  function handleUseRoute(route: Route) {
    prefillData.value = {
      from: route.fromStationId,
      to: route.toStationId,
      code: route.analyticCode,
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function loadMore() {
    if (pagination.hasMore.value) {
      fetchRoutes(pagination.nextPage(), true)
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
          <span v-if="pagination.total.value" class="routes-count"
            >({{ pagination.total.value }})</span
          >
        </h2>

        <ErrorAlert v-model="error" class="mb-4" />

        <!-- Last calculated route (highlighted) -->
        <RouteCard
          v-if="history.lastCalculated.value"
          :route="history.lastCalculated.value"
          highlight
        />

        <!-- Previous routes -->
        <RouteCard
          v-for="route in history.previousRoutes.value"
          :key="route.id"
          :route="route"
          @use="handleUseRoute"
        />

        <!-- Loading indicator -->
        <v-progress-linear
          v-if="pagination.isLoading.value"
          indeterminate
          color="primary"
          class="mt-4"
        />

        <!-- Load more button -->
        <div
          v-if="pagination.hasMore.value && !pagination.isLoading.value"
          class="text-center mt-4"
        >
          <v-btn
            variant="outlined"
            color="primary"
            aria-label="Charger plus de trajets"
            @click="loadMore"
          >
            Charger plus
          </v-btn>
        </div>

        <!-- Empty state -->
        <EmptyState
          v-if="history.isEmpty() && !pagination.isLoading.value"
          icon="mdi-train-variant"
          title="Aucun trajet"
          subtitle="Calculez votre premier trajet pour le voir apparaître ici."
        />
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
