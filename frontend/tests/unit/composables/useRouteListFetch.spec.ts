import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'
import { useRouteListFetch } from '@/composables/useRouteListFetch'
import { routesApi } from '@/services/api'
import type { Route, PaginationMeta } from '@/types/api'

vi.mock('@/services/api', () => ({
  routesApi: {
    list: vi.fn(),
  },
}))

const createMockRoute = (id: string): Route => ({
  id,
  fromStationId: 'MX',
  toStationId: 'ZW',
  analyticCode: 'TEST-001',
  distanceKm: 62.43,
  path: ['MX', 'ZW'],
  createdAt: '2025-01-15T10:30:00Z',
})

const createMockPagination = () => {
  const meta = ref<PaginationMeta | null>(null)
  return {
    isLoading: ref(false),
    perPage: 10,
    hasMore: computed(() => meta.value !== null && meta.value.current_page < meta.value.last_page),
    setMeta: vi.fn((newMeta: PaginationMeta) => {
      meta.value = newMeta
    }),
    nextPage: vi.fn(() => 2),
    incrementTotal: vi.fn(),
  }
}

const createMockHistory = () => ({
  setRoutes: vi.fn(),
  appendRoutes: vi.fn(),
  setLastCalculated: vi.fn(),
})

describe('useRouteListFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetch', () => {
    it('should fetch routes and set them via history', async () => {
      const pagination = createMockPagination()
      const history = createMockHistory()
      const mockRoutes = [createMockRoute('1'), createMockRoute('2')]
      const mockMeta: PaginationMeta = {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 2,
      }

      vi.mocked(routesApi.list).mockResolvedValue({
        data: { data: mockRoutes, meta: mockMeta },
      } as never)

      const { fetch, error } = useRouteListFetch({ pagination, history })
      await fetch()

      expect(routesApi.list).toHaveBeenCalledWith({ page: 1, per_page: 10 })
      expect(history.setRoutes).toHaveBeenCalledWith(mockRoutes)
      expect(pagination.setMeta).toHaveBeenCalledWith(mockMeta)
      expect(error.value).toBeNull()
    })

    it('should append routes when append is true', async () => {
      const pagination = createMockPagination()
      const history = createMockHistory()
      const mockRoutes = [createMockRoute('3')]
      const mockMeta: PaginationMeta = {
        current_page: 2,
        last_page: 2,
        per_page: 10,
        total: 3,
      }

      vi.mocked(routesApi.list).mockResolvedValue({
        data: { data: mockRoutes, meta: mockMeta },
      } as never)

      const { fetch } = useRouteListFetch({ pagination, history })
      await fetch(2, true)

      expect(history.appendRoutes).toHaveBeenCalledWith(mockRoutes)
      expect(history.setRoutes).not.toHaveBeenCalled()
    })

    it('should set error on API failure', async () => {
      const pagination = createMockPagination()
      const history = createMockHistory()

      vi.mocked(routesApi.list).mockRejectedValue(new Error('Network error'))

      const { fetch, error } = useRouteListFetch({ pagination, history })
      await fetch()

      expect(error.value).toBe('Erreur lors du chargement des trajets')
      expect(pagination.isLoading.value).toBe(false)
    })

    it('should manage loading state', async () => {
      const pagination = createMockPagination()
      const history = createMockHistory()

      vi.mocked(routesApi.list).mockResolvedValue({
        data: {
          data: [],
          meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
        },
      } as never)

      const { fetch } = useRouteListFetch({ pagination, history })

      expect(pagination.isLoading.value).toBe(false)
      const promise = fetch()
      expect(pagination.isLoading.value).toBe(true)
      await promise
      expect(pagination.isLoading.value).toBe(false)
    })
  })

  describe('loadMore', () => {
    it('should call fetch with next page when hasMore is true', async () => {
      const pagination = createMockPagination()
      pagination.hasMore = computed(() => true)
      const history = createMockHistory()

      vi.mocked(routesApi.list).mockResolvedValue({
        data: {
          data: [],
          meta: { current_page: 2, last_page: 2, per_page: 10, total: 15 },
        },
      } as never)

      const { loadMore } = useRouteListFetch({ pagination, history })
      await loadMore()

      expect(pagination.nextPage).toHaveBeenCalled()
      expect(routesApi.list).toHaveBeenCalledWith({ page: 2, per_page: 10 })
    })

    it('should not fetch when hasMore is false', () => {
      const pagination = createMockPagination()
      pagination.hasMore = computed(() => false)
      const history = createMockHistory()

      const { loadMore } = useRouteListFetch({ pagination, history })
      loadMore()

      expect(routesApi.list).not.toHaveBeenCalled()
    })
  })

  describe('handleRouteCalculated', () => {
    it('should set last calculated and increment total', () => {
      const pagination = createMockPagination()
      const history = createMockHistory()
      const route = createMockRoute('1')

      const { handleRouteCalculated } = useRouteListFetch({ pagination, history })
      handleRouteCalculated(route)

      expect(history.setLastCalculated).toHaveBeenCalledWith(route)
      expect(pagination.incrementTotal).toHaveBeenCalled()
    })
  })
})
