import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import RouteCard from '@/components/RouteCard.vue'
import { useStationsStore } from '@/stores/stations'
import type { Route } from '@/types/api'

describe('RouteCard', () => {
  const mockRoute: Route = {
    id: 'uuid-123',
    fromStationId: 'MX',
    toStationId: 'ZW',
    analyticCode: 'FRET-001',
    distanceKm: 63.48,
    path: ['MX', 'CGE', 'ZW'],
    createdAt: '2025-01-15T10:30:00Z',
  }

  beforeEach(() => {
    setActivePinia(createPinia())

    const store = useStationsStore()
    store.stations.set('MX', { id: 1, shortName: 'MX', longName: 'Montreux' })
    store.stations.set('CGE', { id: 2, shortName: 'CGE', longName: 'Chamby-Gare' })
    store.stations.set('ZW', { id: 3, shortName: 'ZW', longName: 'Zweisimmen' })
    store.isLoaded = true
  })

  function mountComponent(props: { route: Route; highlight?: boolean } = { route: mockRoute }) {
    return mount(RouteCard, {
      props,
    })
  }

  describe('Station display', () => {
    it('displays departure station longName', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Montreux')
    })

    it('displays arrival station longName', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Zweisimmen')
    })
  })

  describe('Route details', () => {
    it('displays distance formatted to 2 decimals', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('63.48')
      expect(wrapper.text()).toContain('km')
    })

    it('displays analytic code', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('FRET-001')
    })

    it('displays formatted date', () => {
      const wrapper = mountComponent()

      // Date format: fr-CH locale, should include year
      expect(wrapper.text()).toContain('2025')
    })
  })

  describe('PathTimeline integration', () => {
    it('includes PathTimeline component', () => {
      const wrapper = mountComponent()

      expect(wrapper.findComponent({ name: 'PathTimeline' }).exists()).toBe(true)
    })

    it('passes path to PathTimeline', () => {
      const wrapper = mountComponent()

      const timeline = wrapper.findComponent({ name: 'PathTimeline' })
      expect(timeline.props('path')).toEqual(['MX', 'CGE', 'ZW'])
    })
  })

  describe('Highlight mode', () => {
    it('starts expanded when highlight is true', () => {
      const wrapper = mountComponent({ route: mockRoute, highlight: true })

      const timeline = wrapper.findComponent({ name: 'PathTimeline' })
      expect(timeline.props('initialExpanded')).toBe(true)
    })

    it('starts collapsed when highlight is false', () => {
      const wrapper = mountComponent({ route: mockRoute, highlight: false })

      const vm = wrapper.vm as unknown as { isExpanded: boolean }
      expect(vm.isExpanded).toBe(false)
    })

    it('hides use button when highlight is true', () => {
      const wrapper = mountComponent({ route: mockRoute, highlight: true })

      expect(wrapper.text()).not.toContain('Utiliser')
    })

    it('shows use button when highlight is false', () => {
      const wrapper = mountComponent({ route: mockRoute, highlight: false })

      expect(wrapper.text()).toContain('Utiliser')
    })
  })

  describe('Expand/collapse', () => {
    it('toggles expanded state on title click', async () => {
      const wrapper = mountComponent({ route: mockRoute, highlight: false })

      const vm = wrapper.vm as unknown as { isExpanded: boolean }
      expect(vm.isExpanded).toBe(false)

      // Click on the card title to toggle
      const cardTitle = wrapper.find('.v-card-title')
      await cardTitle.trigger('click')

      expect(vm.isExpanded).toBe(true)

      await cardTitle.trigger('click')

      expect(vm.isExpanded).toBe(false)
    })
  })

  describe('Use action', () => {
    it('emits use event on button click', async () => {
      const wrapper = mountComponent({ route: mockRoute, highlight: false })

      // Find the use button by its text content
      const buttons = wrapper.findAll('button')
      const useButton = buttons.find((btn) => btn.text().includes('Utiliser'))

      expect(useButton).toBeDefined()
      await useButton!.trigger('click')

      expect(wrapper.emitted('use')).toBeTruthy()
      expect(wrapper.emitted('use')![0][0]).toEqual(mockRoute)
    })

    it('displays use button', () => {
      const wrapper = mountComponent({ route: mockRoute, highlight: false })

      expect(wrapper.text()).toContain('Utiliser')
    })
  })
})
