<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { statsApi } from '@/services/api'
  import type { DistanceStat, GroupBy } from '@/types/api'

  // Filter state
  const fromDate = ref('')
  const toDate = ref('')
  const groupBy = ref<GroupBy>('none')

  const groupByOptions = [
    { title: 'Aucun', value: 'none' },
    { title: 'Par jour', value: 'day' },
    { title: 'Par mois', value: 'month' },
    { title: 'Par année', value: 'year' },
  ]

  // Data state
  const stats = ref<DistanceStat[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Table headers
  const headers = [
    { title: 'Code analytique', key: 'analyticCode', sortable: true },
    { title: 'Distance totale (km)', key: 'totalDistanceKm', sortable: true },
    { title: 'Période', key: 'group', sortable: true },
  ]

  async function fetchStats() {
    isLoading.value = true
    error.value = null

    try {
      const params: { from?: string; to?: string; groupBy?: GroupBy } = {}

      if (fromDate.value) params.from = fromDate.value
      if (toDate.value) params.to = toDate.value
      if (groupBy.value !== 'none') params.groupBy = groupBy.value

      const { data } = await statsApi.distances(params)
      stats.value = data.items
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      error.value = err.response?.data?.message || 'Erreur lors du chargement des statistiques'
    } finally {
      isLoading.value = false
    }
  }

  function formatDistance(value: number): string {
    return value.toFixed(2)
  }

  onMounted(fetchStats)
</script>

<template>
  <div class="stats-layout">
    <!-- Left panel: Filters -->
    <main class="stats-layout__main">
      <div class="stats-layout__main-content">
        <h1 class="text-h5 font-weight-bold mb-6">Filtrer les statistiques</h1>

        <div class="stats-filters">
          <v-text-field
            v-model="fromDate"
            label="Date de début"
            type="date"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-4"
          />

          <v-text-field
            v-model="toDate"
            label="Date de fin"
            type="date"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-4"
          />

          <v-select
            v-model="groupBy"
            :items="groupByOptions"
            label="Grouper par"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-6"
          />

          <v-btn color="primary" block :loading="isLoading" @click="fetchStats">
            Appliquer les filtres
          </v-btn>
        </div>
      </div>
    </main>

    <!-- Right panel: Results -->
    <aside class="stats-layout__aside">
      <div class="stats-layout__aside-content">
        <h2 class="text-h6 font-weight-bold mb-4">
          Résultats
          <span v-if="stats.length" class="results-count">({{ stats.length }})</span>
        </h2>

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

        <!-- Data table -->
        <v-card v-if="stats.length || isLoading" class="stats-table-card">
          <v-data-table :headers="headers" :items="stats" :loading="isLoading">
            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template #item.totalDistanceKm="{ item }">
              {{ formatDistance(item.totalDistanceKm) }}
            </template>

            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template #item.group="{ item }">
              {{ item.group || '-' }}
            </template>
          </v-data-table>
        </v-card>

        <!-- Empty state -->
        <div v-else-if="!isLoading" class="empty-state text-center pa-8">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-chart-bar</v-icon>
          <div class="text-h6 text-medium-emphasis">Aucune statistique</div>
          <div class="text-body-2 text-medium-emphasis">
            Ajustez les filtres ou calculez des trajets pour voir les statistiques.
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
  .stats-layout {
    display: flex;
    min-height: calc(100vh - 64px);
  }

  /* Left panel - Filters */
  .stats-layout__main {
    flex: 0 0 50%;
    max-width: 400px;
    min-width: 300px;
    background-color: rgb(var(--v-theme-surface));
    border-right: 1px solid rgba(0, 0, 0, 0.06);
  }

  .stats-layout__main-content {
    padding: 30px;
    position: sticky;
    top: 64px;
  }

  /* Right panel - Results */
  .stats-layout__aside {
    flex: 1;
    background-color: #f5f5f5;
    overflow-y: auto;
  }

  .stats-layout__aside-content {
    padding: 30px;
  }

  .results-count {
    font-weight: 400;
    color: #737885;
  }

  .stats-table-card {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .empty-state {
    background-color: rgb(var(--v-theme-surface));
    border: 1px dashed rgba(0, 0, 0, 0.12);
  }

  /* Responsive: stack on mobile */
  @media (max-width: 960px) {
    .stats-layout {
      flex-direction: column;
    }

    .stats-layout__main {
      flex: none;
      max-width: 100%;
      min-width: 100%;
    }

    .stats-layout__main-content {
      padding: 20px;
      position: static;
    }

    .stats-layout__aside-content {
      padding: 20px;
    }
  }
</style>
