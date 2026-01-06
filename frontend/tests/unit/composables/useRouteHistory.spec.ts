import { describe, it, expect } from 'vitest'
import { useRouteHistory } from '@/composables/useRouteHistory'
import type { Route } from '@/types/api'

const createMockRoute = (id: string, overrides: Partial<Route> = {}): Route => ({
  id,
  fromStationId: 'MX',
  toStationId: 'ZW',
  analyticCode: 'TEST-001',
  distanceKm: 62.43,
  path: ['MX', 'ZW'],
  createdAt: '2025-01-15T10:30:00Z',
  ...overrides,
})

describe('useRouteHistory', () => {
  describe('Initial state', () => {
    it('should initialize with empty state', () => {
      const history = useRouteHistory()

      expect(history.routes.value).toEqual([])
      expect(history.lastCalculated.value).toBeNull()
      expect(history.previousRoutes.value).toEqual([])
    })
  })

  describe('isEmpty', () => {
    it('should return true when no routes and no last calculated', () => {
      const history = useRouteHistory()

      expect(history.isEmpty()).toBe(true)
    })

    it('should return false when routes exist', () => {
      const history = useRouteHistory()
      history.routes.value = [createMockRoute('1')]

      expect(history.isEmpty()).toBe(false)
    })

    it('should return false when lastCalculated exists', () => {
      const history = useRouteHistory()
      history.lastCalculated.value = createMockRoute('1')

      expect(history.isEmpty()).toBe(false)
    })
  })

  describe('setRoutes', () => {
    it('should replace routes array', () => {
      const history = useRouteHistory()
      const routes = [createMockRoute('1'), createMockRoute('2')]

      history.setRoutes(routes)

      expect(history.routes.value).toEqual(routes)
    })
  })

  describe('appendRoutes', () => {
    it('should append routes to existing array', () => {
      const history = useRouteHistory()
      history.routes.value = [createMockRoute('1')]

      history.appendRoutes([createMockRoute('2'), createMockRoute('3')])

      expect(history.routes.value).toHaveLength(3)
      expect(history.routes.value[0].id).toBe('1')
      expect(history.routes.value[1].id).toBe('2')
      expect(history.routes.value[2].id).toBe('3')
    })
  })

  describe('setLastCalculated', () => {
    it('should set lastCalculated and add to routes', () => {
      const history = useRouteHistory()
      const route = createMockRoute('1')

      history.setLastCalculated(route)

      expect(history.lastCalculated.value).toEqual(route)
      expect(history.routes.value).toHaveLength(1)
      expect(history.routes.value[0]).toEqual(route)
    })

    it('should add route to beginning of routes', () => {
      const history = useRouteHistory()
      history.routes.value = [createMockRoute('2')]
      const newRoute = createMockRoute('1')

      history.setLastCalculated(newRoute)

      expect(history.routes.value[0].id).toBe('1')
    })

    it('should not duplicate route if already present', () => {
      const history = useRouteHistory()
      const route = createMockRoute('1')
      history.routes.value = [route]

      history.setLastCalculated(route)

      expect(history.routes.value).toHaveLength(1)
    })
  })

  describe('clearLastCalculated', () => {
    it('should clear lastCalculated', () => {
      const history = useRouteHistory()
      history.lastCalculated.value = createMockRoute('1')

      history.clearLastCalculated()

      expect(history.lastCalculated.value).toBeNull()
    })
  })

  describe('previousRoutes computed', () => {
    it('should return all routes when no lastCalculated', () => {
      const history = useRouteHistory()
      const routes = [createMockRoute('1'), createMockRoute('2')]
      history.routes.value = routes

      expect(history.previousRoutes.value).toEqual(routes)
    })

    it('should exclude lastCalculated from previousRoutes', () => {
      const history = useRouteHistory()
      const route1 = createMockRoute('1')
      const route2 = createMockRoute('2')
      history.routes.value = [route1, route2]
      history.lastCalculated.value = route1

      expect(history.previousRoutes.value).toHaveLength(1)
      expect(history.previousRoutes.value[0].id).toBe('2')
    })
  })
})
