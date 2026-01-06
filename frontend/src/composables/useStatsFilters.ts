import { ref, computed } from 'vue'
import type { GroupBy } from '@/types/api'
import { formatDateApi } from '@/utils/formatters'

export const GROUP_BY_OPTIONS = [
  { title: 'Aucun', value: 'none' as const },
  { title: 'Par jour', value: 'day' as const },
  { title: 'Par mois', value: 'month' as const },
  { title: 'Par année', value: 'year' as const },
]

/**
 * Composable for managing stats filter state.
 */
export function useStatsFilters() {
  const fromDate = ref<Date | null>(null)
  const toDate = ref<Date | null>(null)
  const groupBy = ref<GroupBy>('none')

  const hasActiveFilters = computed(() => {
    return fromDate.value !== null || toDate.value !== null || groupBy.value !== 'none'
  })

  function getParams(): { from?: string; to?: string; groupBy?: GroupBy } {
    const params: { from?: string; to?: string; groupBy?: GroupBy } = {}

    const fromStr = formatDateApi(fromDate.value)
    const toStr = formatDateApi(toDate.value)

    if (fromStr) params.from = fromStr
    if (toStr) params.to = toStr
    if (groupBy.value !== 'none') params.groupBy = groupBy.value

    return params
  }

  function reset(): void {
    fromDate.value = null
    toDate.value = null
    groupBy.value = 'none'
  }

  return {
    fromDate,
    toDate,
    groupBy,
    hasActiveFilters,
    getParams,
    reset,
  }
}
