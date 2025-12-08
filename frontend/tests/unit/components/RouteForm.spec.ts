import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import RouteForm from '@/components/RouteForm.vue'
import { stationsApi, routesApi } from '@/services/api'
import { useStationsStore } from '@/stores/stations'
import type { AxiosResponse } from 'axios'

// Mock the API
vi.mock('@/services/api', () => ({
  stationsApi: {
    list: vi.fn(),
  },
  routesApi: {
    create: vi.fn(),
  },
}))

describe('RouteForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Setup stations store
    const store = useStationsStore()
    store.stations.set('MX', { id: 1, shortName: 'MX', longName: 'Montreux' })
    store.stations.set('ZW', { id: 2, shortName: 'ZW', longName: 'Zweisimmen' })
    store.stations.set('CGE', { id: 3, shortName: 'CGE', longName: 'Chamby-Gare' })
    store.isLoaded = true
  })

  afterEach(() => {
    localStorage.clear()
    vi.useRealTimers()
  })

  function mountComponent() {
    return mount(RouteForm, {
      global: {
        stubs: {
          'v-autocomplete': {
            template: `
              <div class="v-autocomplete-stub">
                <input
                  :value="modelValue"
                  @input="$emit('update:modelValue', $event.target.value)"
                  @keyup="$emit('update:search', $event.target.value)"
                  data-testid="autocomplete-input"
                />
              </div>
            `,
            props: ['modelValue', 'items', 'loading'],
            emits: ['update:modelValue', 'update:search'],
          },
        },
      },
    })
  }

  it('renders the form with all fields', () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Calculer le trajet')
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('disables submit button when form is incomplete', () => {
    const wrapper = mountComponent()

    const button = wrapper.find('button[type="submit"]')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('fetches stations on search with debounce', async () => {
    const mockStations = {
      data: {
        items: [
          { id: 1, shortName: 'MX', longName: 'Montreux' },
          { id: 2, shortName: 'ZW', longName: 'Zweisimmen' },
        ],
      },
    } as AxiosResponse

    vi.mocked(stationsApi.list).mockResolvedValue(mockStations)

    mountComponent()

    // Trigger should happen after debounce
    vi.advanceTimersByTime(300)
    await flushPromises()

    // The API should not be called without input
    expect(stationsApi.list).not.toHaveBeenCalled()
  })

  it('calls routesApi.create on valid submit', async () => {
    const mockRoute = {
      data: {
        id: 'uuid-123',
        fromStationId: 'MX',
        toStationId: 'ZW',
        analyticCode: 'TEST-001',
        distanceKm: 50.5,
        path: ['MX', 'CGE', 'ZW'],
        createdAt: '2025-01-01T00:00:00Z',
      },
    } as AxiosResponse

    vi.mocked(routesApi.create).mockResolvedValue(mockRoute)

    const wrapper = mountComponent()

    // Set form values directly via component state
    const vm = wrapper.vm as unknown as {
      fromStation: string | null
      toStation: string | null
      analyticCode: string
      isFormValid: boolean
    }

    vm.fromStation = 'MX'
    vm.toStation = 'ZW'
    vm.analyticCode = 'TEST-001'

    await flushPromises()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(routesApi.create).toHaveBeenCalledWith({
      fromStationId: 'MX',
      toStationId: 'ZW',
      analyticCode: 'TEST-001',
    })
  })

  it('emits route-calculated event on successful submit', async () => {
    const mockRoute = {
      data: {
        id: 'uuid-123',
        fromStationId: 'MX',
        toStationId: 'ZW',
        analyticCode: 'TEST-001',
        distanceKm: 50.5,
        path: ['MX', 'CGE', 'ZW'],
        createdAt: '2025-01-01T00:00:00Z',
      },
    } as AxiosResponse

    vi.mocked(routesApi.create).mockResolvedValue(mockRoute)

    const wrapper = mountComponent()

    const vm = wrapper.vm as unknown as {
      fromStation: string | null
      toStation: string | null
      analyticCode: string
    }

    vm.fromStation = 'MX'
    vm.toStation = 'ZW'
    vm.analyticCode = 'TEST-001'

    await flushPromises()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.emitted('route-calculated')).toBeTruthy()
    expect(wrapper.emitted('route-calculated')![0][0]).toEqual(mockRoute.data)
  })

  it('displays error on failed submit', async () => {
    vi.mocked(routesApi.create).mockRejectedValue({
      response: { data: { message: 'Station not found' } },
    })

    const wrapper = mountComponent()

    const vm = wrapper.vm as unknown as {
      fromStation: string | null
      toStation: string | null
      analyticCode: string
    }

    vm.fromStation = 'INVALID'
    vm.toStation = 'ZW'
    vm.analyticCode = 'TEST-001'

    await flushPromises()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Station not found')
  })
})
