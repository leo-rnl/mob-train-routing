import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PathTimeline from '@/components/PathTimeline.vue'
import { useStationsStore } from '@/stores/stations'

describe('PathTimeline', () => {
  beforeEach(() => {
    setActivePinia(createPinia())

    // Setup stations store with test data
    const store = useStationsStore()
    store.stations.set('MX', { id: 1, shortName: 'MX', longName: 'Montreux' })
    store.stations.set('CGE', { id: 2, shortName: 'CGE', longName: 'Chamby-Gare' })
    store.stations.set('VUAR', { id: 3, shortName: 'VUAR', longName: 'Les Avants' })
    store.stations.set('ZW', { id: 4, shortName: 'ZW', longName: 'Zweisimmen' })
    store.isLoaded = true
  })

  function mountComponent(path: string[], initialExpanded = false) {
    return mount(PathTimeline, {
      props: { path, initialExpanded },
    })
  }

  describe('Collapsed mode', () => {
    it('shows only departure and arrival stations when collapsed', () => {
      const wrapper = mountComponent(['MX', 'CGE', 'VUAR', 'ZW'])

      expect(wrapper.text()).toContain('Montreux')
      expect(wrapper.text()).toContain('Zweisimmen')
      expect(wrapper.text()).not.toContain('Chamby-Gare')
      expect(wrapper.text()).not.toContain('Les Avants')
    })

    it('shows expand button with hidden count', () => {
      const wrapper = mountComponent(['MX', 'CGE', 'VUAR', 'ZW'])

      expect(wrapper.text()).toContain('Afficher 2 station(s) intermédiaire(s)')
    })
  })

  describe('Expanded mode', () => {
    it('shows all stations when initialExpanded is true', () => {
      const wrapper = mountComponent(['MX', 'CGE', 'VUAR', 'ZW'], true)

      expect(wrapper.text()).toContain('Montreux')
      expect(wrapper.text()).toContain('Chamby-Gare')
      expect(wrapper.text()).toContain('Les Avants')
      expect(wrapper.text()).toContain('Zweisimmen')
    })

    it('shows collapse button when expanded', () => {
      const wrapper = mountComponent(['MX', 'CGE', 'VUAR', 'ZW'], true)

      expect(wrapper.text()).toContain('Réduire')
    })
  })

  describe('Toggle behavior', () => {
    it('expands on button click', async () => {
      const wrapper = mountComponent(['MX', 'CGE', 'VUAR', 'ZW'])

      expect(wrapper.text()).not.toContain('Chamby-Gare')

      await wrapper.find('button').trigger('click')

      expect(wrapper.text()).toContain('Chamby-Gare')
      expect(wrapper.text()).toContain('Les Avants')
      expect(wrapper.text()).toContain('Réduire')
    })

    it('collapses on second button click', async () => {
      const wrapper = mountComponent(['MX', 'CGE', 'VUAR', 'ZW'], true)

      await wrapper.find('button').trigger('click')

      expect(wrapper.text()).not.toContain('Chamby-Gare')
      expect(wrapper.text()).toContain('Afficher 2 station(s) intermédiaire(s)')
    })
  })

  describe('Short paths', () => {
    it('shows all stations for 2-station path without toggle', () => {
      const wrapper = mountComponent(['MX', 'ZW'])

      expect(wrapper.text()).toContain('Montreux')
      expect(wrapper.text()).toContain('Zweisimmen')
      expect(wrapper.find('button').exists()).toBe(false)
    })

    it('shows single station path', () => {
      const wrapper = mountComponent(['MX'])

      expect(wrapper.text()).toContain('Montreux')
      expect(wrapper.find('button').exists()).toBe(false)
    })
  })

  describe('Station name resolution', () => {
    it('uses shortName as fallback when station not in store', () => {
      // Use expanded mode so UNKNOWN is visible
      const wrapper = mountComponent(['MX', 'UNKNOWN', 'ZW'], true)

      // Should show UNKNOWN as fallback
      expect(wrapper.text()).toContain('UNKNOWN')
    })

    it('displays shortName alongside longName', () => {
      const wrapper = mountComponent(['MX', 'ZW'])

      // Should show both long and short names
      expect(wrapper.text()).toContain('Montreux')
      expect(wrapper.text()).toContain('MX')
    })
  })
})
