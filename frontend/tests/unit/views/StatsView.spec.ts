import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import StatsView from '@/views/StatsView.vue'
import { statsApi } from '@/services/api'
import type { AxiosResponse } from 'axios'

// Mock the API
vi.mock('@/services/api', () => ({
  statsApi: {
    distances: vi.fn(),
  },
}))

describe('StatsView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  const mockStatsResponse = {
    data: {
      from: null,
      to: null,
      groupBy: 'none',
      items: [
        { analyticCode: 'FRET-001', totalDistanceKm: 125.5 },
        { analyticCode: 'FRET-002', totalDistanceKm: 250.0 },
      ],
    },
  } as AxiosResponse

  function mountComponent() {
    return mount(StatsView, {
      global: {
        stubs: {
          'v-data-table': {
            template: `
              <div class="v-data-table-stub">
                <slot name="no-data" />
                <div v-for="item in items" :key="item.analyticCode" class="table-row">
                  <span>{{ item.analyticCode }}</span>
                  <span>{{ item.totalDistanceKm }}</span>
                  <span>{{ item.group || '-' }}</span>
                </div>
              </div>
            `,
            props: ['headers', 'items', 'loading'],
          },
        },
      },
    })
  }

  it('renders the stats title', () => {
    vi.mocked(statsApi.distances).mockResolvedValue(mockStatsResponse)

    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Filtrer les statistiques')
  })

  it('fetches stats on mount', async () => {
    vi.mocked(statsApi.distances).mockResolvedValue(mockStatsResponse)

    mountComponent()
    await flushPromises()

    expect(statsApi.distances).toHaveBeenCalled()
  })

  it('displays date filter inputs', () => {
    vi.mocked(statsApi.distances).mockResolvedValue(mockStatsResponse)

    const wrapper = mountComponent()

    const dateInputs = wrapper.findAll('input[type="date"]')
    expect(dateInputs.length).toBe(2)
  })

  it('displays groupBy select', () => {
    vi.mocked(statsApi.distances).mockResolvedValue(mockStatsResponse)

    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Grouper par')
  })

  it('displays filter button', () => {
    vi.mocked(statsApi.distances).mockResolvedValue(mockStatsResponse)

    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Appliquer les filtres')
  })

  it('calls API with filter params on button click', async () => {
    vi.mocked(statsApi.distances).mockResolvedValue(mockStatsResponse)

    const wrapper = mountComponent()
    await flushPromises()

    // Set filter values
    const dateInputs = wrapper.findAll('input[type="date"]')
    await dateInputs[0].setValue('2025-01-01')
    await dateInputs[1].setValue('2025-01-31')

    // Click filter button
    const filterButton = wrapper.findAll('button').find((b) => b.text().includes('Appliquer'))
    await filterButton?.trigger('click')
    await flushPromises()

    expect(statsApi.distances).toHaveBeenLastCalledWith({
      from: '2025-01-01',
      to: '2025-01-31',
    })
  })

  it('displays stats data', async () => {
    vi.mocked(statsApi.distances).mockResolvedValue(mockStatsResponse)

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.text()).toContain('FRET-001')
    expect(wrapper.text()).toContain('125.5')
    expect(wrapper.text()).toContain('FRET-002')
    expect(wrapper.text()).toContain('250')
  })

  it('displays error message on API failure', async () => {
    vi.mocked(statsApi.distances).mockRejectedValue({
      response: { data: { message: 'Server error' } },
    })

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.text()).toContain('Server error')
  })

  it('displays no data message when empty', async () => {
    vi.mocked(statsApi.distances).mockResolvedValue({
      data: { from: null, to: null, groupBy: 'none', items: [] },
    } as AxiosResponse)

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.text()).toContain('Aucune statistique')
  })
})
