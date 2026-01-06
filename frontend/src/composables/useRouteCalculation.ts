import { ref } from 'vue'
import { routesApi } from '@/services/api'
import { getApiErrorMessage } from '@/utils/errorUtils'
import type { Route, CreateRouteRequest } from '@/types/api'

/**
 * Composable for calculating routes via API.
 * Encapsulates the API call logic and error handling.
 */
export function useRouteCalculation() {
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function calculate(request: CreateRouteRequest): Promise<Route | null> {
    isSubmitting.value = true
    error.value = null

    try {
      const { data } = await routesApi.create(request)
      return data
    } catch (e) {
      error.value = getApiErrorMessage(e, 'Erreur lors du calcul du trajet')
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    isSubmitting,
    error,
    calculate,
    clearError,
  }
}
