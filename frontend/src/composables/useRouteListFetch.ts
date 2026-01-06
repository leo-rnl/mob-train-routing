import { ref } from 'vue'
import { routesApi } from '@/services/api'
import { getApiErrorMessage } from '@/utils/errorUtils'
import type { Route } from '@/types/api'
import type { usePagination } from './usePagination'
import type { useRouteHistory } from './useRouteHistory'

interface UseRouteListFetchOptions {
  pagination: ReturnType<typeof usePagination>
  history: ReturnType<typeof useRouteHistory>
}

/**
 * Composable for fetching route list from API.
 * Encapsulates the API call logic and error handling.
 */
export function useRouteListFetch({ pagination, history }: UseRouteListFetchOptions) {
  const error = ref<string | null>(null)

  async function fetch(page = 1, append = false): Promise<void> {
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

  function loadMore(): void {
    if (pagination.hasMore.value) {
      fetch(pagination.nextPage(), true)
    }
  }

  function handleRouteCalculated(route: Route): void {
    history.setLastCalculated(route)
    pagination.incrementTotal()
  }

  return {
    error,
    fetch,
    loadMore,
    handleRouteCalculated,
  }
}
