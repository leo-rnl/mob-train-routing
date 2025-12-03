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
  <v-container>
    <v-row justify="center">
      <v-col cols="12" lg="10">
        <v-card class="mb-4">
          <v-card-title>Statistiques des distances</v-card-title>

          <v-card-text>
            <v-row align="center">
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="fromDate"
                  label="Date de début"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="toDate"
                  label="Date de fin"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="groupBy"
                  :items="groupByOptions"
                  label="Grouper par"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-btn color="primary" block :loading="isLoading" @click="fetchStats">
                  Filtrer
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

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

        <v-card>
          <v-data-table :headers="headers" :items="stats" :loading="isLoading" class="elevation-1">
            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template #item.totalDistanceKm="{ item }">
              {{ formatDistance(item.totalDistanceKm) }}
            </template>

            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template #item.group="{ item }">
              {{ item.group || '-' }}
            </template>

            <template #no-data>
              <div class="text-center pa-4 text-medium-emphasis">Aucune statistique disponible</div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
