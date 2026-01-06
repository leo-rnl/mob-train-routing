import { describe, it, expect } from 'vitest'
import { usePagination } from '@/composables/usePagination'
import type { PaginationMeta } from '@/types/api'

describe('usePagination', () => {
  describe('Initial state', () => {
    it('should initialize with default values', () => {
      const pagination = usePagination()

      expect(pagination.currentPage.value).toBe(1)
      expect(pagination.meta.value).toBeNull()
      expect(pagination.isLoading.value).toBe(false)
      expect(pagination.perPage).toBe(10)
    })

    it('should accept custom perPage option', () => {
      const pagination = usePagination({ perPage: 20 })

      expect(pagination.perPage).toBe(20)
    })
  })

  describe('hasMore computed', () => {
    it('should return false when meta is null', () => {
      const pagination = usePagination()

      expect(pagination.hasMore.value).toBe(false)
    })

    it('should return true when current page is less than last page', () => {
      const pagination = usePagination()
      pagination.meta.value = {
        current_page: 1,
        last_page: 3,
        per_page: 10,
        total: 25,
      }

      expect(pagination.hasMore.value).toBe(true)
    })

    it('should return false when on last page', () => {
      const pagination = usePagination()
      pagination.meta.value = {
        current_page: 3,
        last_page: 3,
        per_page: 10,
        total: 25,
      }

      expect(pagination.hasMore.value).toBe(false)
    })
  })

  describe('total computed', () => {
    it('should return 0 when meta is null', () => {
      const pagination = usePagination()

      expect(pagination.total.value).toBe(0)
    })

    it('should return total from meta', () => {
      const pagination = usePagination()
      pagination.meta.value = {
        current_page: 1,
        last_page: 3,
        per_page: 10,
        total: 25,
      }

      expect(pagination.total.value).toBe(25)
    })
  })

  describe('setMeta', () => {
    it('should update meta and currentPage', () => {
      const pagination = usePagination()
      const meta: PaginationMeta = {
        current_page: 2,
        last_page: 5,
        per_page: 10,
        total: 50,
      }

      pagination.setMeta(meta)

      expect(pagination.meta.value).toEqual(meta)
      expect(pagination.currentPage.value).toBe(2)
    })
  })

  describe('reset', () => {
    it('should reset to initial state', () => {
      const pagination = usePagination()
      pagination.meta.value = {
        current_page: 3,
        last_page: 5,
        per_page: 10,
        total: 50,
      }
      pagination.currentPage.value = 3

      pagination.reset()

      expect(pagination.currentPage.value).toBe(1)
      expect(pagination.meta.value).toBeNull()
    })
  })

  describe('nextPage', () => {
    it('should return current page + 1', () => {
      const pagination = usePagination()
      pagination.currentPage.value = 2

      expect(pagination.nextPage()).toBe(3)
    })
  })

  describe('incrementTotal', () => {
    it('should increment total when meta exists', () => {
      const pagination = usePagination()
      pagination.meta.value = {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 5,
      }

      pagination.incrementTotal()

      expect(pagination.meta.value?.total).toBe(6)
    })

    it('should do nothing when meta is null', () => {
      const pagination = usePagination()

      pagination.incrementTotal()

      expect(pagination.meta.value).toBeNull()
    })
  })
})
