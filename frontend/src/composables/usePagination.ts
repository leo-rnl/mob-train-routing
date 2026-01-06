import { ref, computed } from 'vue'
import type { PaginationMeta } from '@/types/api'

interface UsePaginationOptions {
  perPage?: number
}

/**
 * Composable for managing pagination state and logic.
 */
export function usePagination(options: UsePaginationOptions = {}) {
  const { perPage = 10 } = options

  const currentPage = ref(1)
  const meta = ref<PaginationMeta | null>(null)
  const isLoading = ref(false)

  const hasMore = computed(() => {
    if (!meta.value) return false
    return meta.value.current_page < meta.value.last_page
  })

  const total = computed(() => meta.value?.total ?? 0)

  function setMeta(newMeta: PaginationMeta): void {
    meta.value = newMeta
    currentPage.value = newMeta.current_page
  }

  function reset(): void {
    currentPage.value = 1
    meta.value = null
  }

  function nextPage(): number {
    return currentPage.value + 1
  }

  function incrementTotal(): void {
    if (meta.value) {
      meta.value = { ...meta.value, total: meta.value.total + 1 }
    }
  }

  return {
    currentPage,
    meta,
    isLoading,
    hasMore,
    total,
    perPage,
    setMeta,
    reset,
    nextPage,
    incrementTotal,
  }
}
