import { ref } from 'vue'
import { statsApi } from '@/services/api'
import { getApiErrorMessage } from '@/utils/errorUtils'
import type { DistanceStat, GroupBy } from '@/types/api'
import type { useStatsFilters } from './useStatsFilters'

interface UseStatsFetchOptions {
  filters: ReturnType<typeof useStatsFilters>
}

/**
 * Composable for fetching distance statistics from API.
 * Encapsulates the API call logic and error handling.
 */
export function useStatsFetch({ filters }: UseStatsFetchOptions) {
  const stats = ref<DistanceStat[]>([])
  const appliedGroupBy = ref<GroupBy>('none')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetch(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const params = filters.getParams()
      const { data } = await statsApi.distances(params)
      stats.value = data.items
      appliedGroupBy.value = filters.groupBy.value
    } catch (e) {
      error.value = getApiErrorMessage(e, 'Erreur lors du chargement des statistiques')
    } finally {
      isLoading.value = false
    }
  }

  function resetAndFetch(): void {
    filters.reset()
    fetch()
  }

  return {
    stats,
    appliedGroupBy,
    isLoading,
    error,
    fetch,
    resetAndFetch,
  }
}
