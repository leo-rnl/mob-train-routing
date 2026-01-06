import { computed, type Ref, type ComputedRef } from 'vue'
import type { Station } from '@/types/api'

const DEFAULT_STATIONS_COUNT = 5

interface UseStationFilterOptions {
  stations: ComputedRef<Station[]>
  search: Ref<string>
  selected: Ref<string | null>
}

/**
 * Composable for filtering stations in autocomplete fields.
 * Handles search filtering and ensures selected station is always visible.
 */
export function useStationFilter({ stations, search, selected }: UseStationFilterOptions) {
  const filteredStations = computed(() => {
    const searchTerm = search.value.toLowerCase()
    let results: Station[]

    if (!searchTerm || searchTerm.length < 2) {
      results = stations.value.slice(0, DEFAULT_STATIONS_COUNT)
    } else {
      results = stations.value.filter(
        (s) =>
          s.shortName.toLowerCase().includes(searchTerm) ||
          s.longName.toLowerCase().includes(searchTerm)
      )
    }

    // Ensure selected station is always in the list
    if (selected.value) {
      const selectedInResults = results.some((s) => s.shortName === selected.value)
      if (!selectedInResults) {
        const selectedStation = stations.value.find((s) => s.shortName === selected.value)
        if (selectedStation) {
          results = [selectedStation, ...results]
        }
      }
    }

    return results
  })

  return {
    filteredStations,
  }
}
