import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RouteResult from '@/components/RouteResult.vue'
import type { Route, Station } from '@/types/api'

describe('RouteResult', () => {
  const mockRoute: Route = {
    id: 'uuid-123',
    fromStationId: 'MX',
    toStationId: 'ZW',
    analyticCode: 'TEST-001',
    distanceKm: 63.48,
    path: ['MX', 'CGE', 'VUAR', 'ZW'],
    createdAt: '2025-01-01T10:30:00Z',
  }

  const mockStationsMap = new Map<string, Station>([
    ['MX', { id: 1, shortName: 'MX', longName: 'Montreux' }],
    ['CGE', { id: 2, shortName: 'CGE', longName: 'Chamby-Gare' }],
    ['VUAR', { id: 3, shortName: 'VUAR', longName: 'Les Avants' }],
    ['ZW', { id: 4, shortName: 'ZW', longName: 'Zweisimmen' }],
  ])

  function mountComponent(route = mockRoute, stationsMap = mockStationsMap) {
    return mount(RouteResult, {
      props: {
        route,
        stationsMap,
      },
    })
  }

  it('displays the route title', () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Résultat du trajet')
  })

  it('displays departure station with longName', () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Montreux')
  })

  it('displays arrival station with longName', () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Zweisimmen')
  })

  it('displays distance formatted to 2 decimals', () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('63.48')
    expect(wrapper.text()).toContain('km')
  })

  it('displays analytic code', () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('TEST-001')
  })

  it('displays path with all stations', () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Montreux')
    expect(wrapper.text()).toContain('Chamby-Gare')
    expect(wrapper.text()).toContain('Les Avants')
    expect(wrapper.text()).toContain('Zweisimmen')
  })

  it('displays shortName when longName not in map', () => {
    const incompleteMap = new Map<string, Station>([
      ['MX', { id: 1, shortName: 'MX', longName: 'Montreux' }],
    ])

    const wrapper = mountComponent(mockRoute, incompleteMap)

    // Should show shortName for stations not in map
    expect(wrapper.text()).toContain('CGE')
    expect(wrapper.text()).toContain('VUAR')
    expect(wrapper.text()).toContain('ZW')
  })

  it('handles route with single station path', () => {
    const singleStationRoute: Route = {
      ...mockRoute,
      path: ['MX'],
    }

    const wrapper = mountComponent(singleStationRoute)

    expect(wrapper.text()).toContain('Montreux')
  })
})
