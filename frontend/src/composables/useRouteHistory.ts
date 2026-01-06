import { ref, computed } from 'vue'
import type { Route } from '@/types/api'

/**
 * Composable for managing route history and the last calculated route.
 */
export function useRouteHistory() {
  const routes = ref<Route[]>([])
  const lastCalculated = ref<Route | null>(null)

  // Previous routes excluding the last calculated one
  const previousRoutes = computed(() => {
    if (!lastCalculated.value) return routes.value
    return routes.value.filter((r) => r.id !== lastCalculated.value?.id)
  })

  function setRoutes(newRoutes: Route[]): void {
    routes.value = newRoutes
  }

  function appendRoutes(newRoutes: Route[]): void {
    routes.value = [...routes.value, ...newRoutes]
  }

  function setLastCalculated(route: Route): void {
    lastCalculated.value = route

    // Add to beginning if not already present
    const existingIndex = routes.value.findIndex((r) => r.id === route.id)
    if (existingIndex === -1) {
      routes.value.unshift(route)
    }
  }

  function clearLastCalculated(): void {
    lastCalculated.value = null
  }

  function isEmpty(): boolean {
    return routes.value.length === 0 && !lastCalculated.value
  }

  return {
    routes,
    lastCalculated,
    previousRoutes,
    setRoutes,
    appendRoutes,
    setLastCalculated,
    clearLastCalculated,
    isEmpty,
  }
}
