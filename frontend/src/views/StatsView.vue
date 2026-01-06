<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useStatsFilters, GROUP_BY_OPTIONS } from '@/composables/useStatsFilters'
  import { useStatsFetch } from '@/composables/useStatsFetch'
  import StatsChart from '@/components/StatsChart.vue'
  import EmptyState from '@/components/EmptyState.vue'
  import ErrorAlert from '@/components/ErrorAlert.vue'
  import { formatDistanceValue } from '@/utils/formatters'

  // Composables
  const filters = useStatsFilters()
  const statsFetch = useStatsFetch({ filters })

  // Table headers
  const headers = [
    { title: 'Code analytique', key: 'analyticCode', sortable: true },
    { title: 'Distance totale (km)', key: 'totalDistanceKm', sortable: true },
    { title: 'Période', key: 'group', sortable: true },
  ]

  onMounted(() => statsFetch.fetch())
</script>

<template>
  <div class="stats-layout">
    <!-- Left panel: Filters -->
    <main class="stats-layout__main">
      <div class="stats-layout__main-content">
        <h1 class="text-h5 font-weight-bold mb-6">Filtrer les statistiques</h1>

        <div class="stats-filters">
          <v-date-input
            v-model="filters.fromDate.value"
            label="Date de début"
            variant="outlined"
            density="compact"
            hide-details
            prepend-icon=""
            prepend-inner-icon="mdi-calendar"
            class="mb-4"
          />

          <v-date-input
            v-model="filters.toDate.value"
            label="Date de fin"
            variant="outlined"
            density="compact"
            hide-details
            prepend-icon=""
            prepend-inner-icon="mdi-calendar"
            class="mb-4"
          />

          <v-select
            v-model="filters.groupBy.value"
            :items="GROUP_BY_OPTIONS"
            label="Grouper par"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-6"
          />

          <v-btn color="primary" block :loading="statsFetch.isLoading.value" @click="statsFetch.fetch">
            Appliquer les filtres
          </v-btn>

          <v-btn
            v-if="filters.hasActiveFilters.value"
            variant="text"
            block
            class="mt-2"
            :disabled="statsFetch.isLoading.value"
            aria-label="Réinitialiser tous les filtres"
            @click="statsFetch.resetAndFetch"
          >
            Réinitialiser
          </v-btn>
        </div>
      </div>
    </main>

    <!-- Right panel: Results -->
    <aside class="stats-layout__aside">
      <div class="stats-layout__aside-content">
        <h2 class="text-h6 font-weight-bold mb-4">
          Résultats
          <span v-if="statsFetch.stats.value.length" class="results-count">({{ statsFetch.stats.value.length }})</span>
        </h2>

        <ErrorAlert v-model="statsFetch.error.value" class="mb-4" />

        <!-- Chart -->
        <StatsChart :data="statsFetch.stats.value" :group-by="statsFetch.appliedGroupBy.value" :loading="statsFetch.isLoading.value" />

        <!-- Data table -->
        <v-card v-if="statsFetch.stats.value.length || statsFetch.isLoading.value" class="stats-table-card">
          <v-data-table :headers="headers" :items="statsFetch.stats.value" :loading="statsFetch.isLoading.value">
            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template #item.totalDistanceKm="{ item }">
              {{ formatDistanceValue(item.totalDistanceKm) }}
            </template>

            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template #item.group="{ item }">
              {{ item.group || '-' }}
            </template>
          </v-data-table>
        </v-card>

        <!-- Empty state -->
        <EmptyState
          v-else-if="!statsFetch.isLoading.value"
          icon="mdi-chart-bar"
          title="Aucune statistique"
          subtitle="Ajustez les filtres ou calculez des trajets pour voir les statistiques."
        />
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
    transition: border-color 0.15s ease;
    border: 2px solid transparent;
  }

  .stats-table-card:hover {
    border-color: #000;
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
