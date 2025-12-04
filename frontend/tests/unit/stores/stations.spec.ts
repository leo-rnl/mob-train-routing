import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStationsStore } from '@/stores/stations'
import { stationsApi } from '@/services/api'
import type { AxiosResponse } from 'axios'
import type { StationsResponse } from '@/types/api'

// Mock the API module
vi.mock('@/services/api', () => ({
  stationsApi: {
    list: vi.fn(),
  },
}))

describe('Stations Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Initial state', () => {
    it('should initialize with empty stations', () => {
      const store = useStationsStore()

      expect(store.stations.size).toBe(0)
      expect(store.isLoading).toBe(false)
      expect(store.isLoaded).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('getStationName getter', () => {
    it('should return longName when station exists', () => {
      const store = useStationsStore()
      store.stations.set('MX', { id: 1, shortName: 'MX', longName: 'Montreux' })

      expect(store.getStationName('MX')).toBe('Montreux')
    })

    it('should return shortName as fallback when station not found', () => {
      const store = useStationsStore()

      expect(store.getStationName('UNKNOWN')).toBe('UNKNOWN')
    })
  })

  describe('getStation getter', () => {
    it('should return station object when exists', () => {
      const store = useStationsStore()
      const station = { id: 1, shortName: 'MX', longName: 'Montreux' }
      store.stations.set('MX', station)

      expect(store.getStation('MX')).toEqual(station)
    })

    it('should return undefined when station not found', () => {
      const store = useStationsStore()

      expect(store.getStation('UNKNOWN')).toBeUndefined()
    })
  })

  describe('stationsList getter', () => {
    it('should return all stations as array', () => {
      const store = useStationsStore()
      store.stations.set('MX', { id: 1, shortName: 'MX', longName: 'Montreux' })
      store.stations.set('ZW', { id: 2, shortName: 'ZW', longName: 'Zweisimmen' })

      const list = store.stationsList

      expect(list).toHaveLength(2)
      expect(list).toContainEqual({ id: 1, shortName: 'MX', longName: 'Montreux' })
      expect(list).toContainEqual({ id: 2, shortName: 'ZW', longName: 'Zweisimmen' })
    })
  })

  describe('fetchAll action', () => {
    it('should fetch and store stations from API', async () => {
      const mockResponse: AxiosResponse<StationsResponse> = {
        data: {
          items: [
            { id: 1, shortName: 'MX', longName: 'Montreux' },
            { id: 2, shortName: 'ZW', longName: 'Zweisimmen' },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosResponse['config'],
      }
      vi.mocked(stationsApi.list).mockResolvedValue(mockResponse)

      const store = useStationsStore()
      await store.fetchAll()

      expect(store.stations.size).toBe(2)
      expect(store.isLoaded).toBe(true)
      expect(store.isLoading).toBe(false)
      expect(store.getStationName('MX')).toBe('Montreux')
      expect(stationsApi.list).toHaveBeenCalledWith({ connected: true })
    })

    it('should save to localStorage after fetch', async () => {
      const mockResponse: AxiosResponse<StationsResponse> = {
        data: {
          items: [{ id: 1, shortName: 'MX', longName: 'Montreux' }],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosResponse['config'],
      }
      vi.mocked(stationsApi.list).mockResolvedValue(mockResponse)

      const store = useStationsStore()
      await store.fetchAll()

      expect(localStorage.getItem('stations_cache')).toBeTruthy()
      const cached = JSON.parse(localStorage.getItem('stations_cache')!)
      expect(cached).toContainEqual(['MX', { id: 1, shortName: 'MX', longName: 'Montreux' }])
    })

    it('should set error on API failure', async () => {
      const mockError = {
        response: { data: { message: 'Server error' } },
      }
      vi.mocked(stationsApi.list).mockRejectedValue(mockError)

      const store = useStationsStore()
      await store.fetchAll()

      expect(store.error).toBe('Server error')
      expect(store.isLoading).toBe(false)
    })

    it('should not fetch if already loading', async () => {
      const store = useStationsStore()
      store.isLoading = true

      await store.fetchAll()

      expect(stationsApi.list).not.toHaveBeenCalled()
    })
  })

  describe('loadFromCache action', () => {
    it('should load stations from localStorage', () => {
      const cached = JSON.stringify([['MX', { id: 1, shortName: 'MX', longName: 'Montreux' }]])
      localStorage.setItem('stations_cache', cached)

      const store = useStationsStore()
      const result = store.loadFromCache()

      expect(result).toBe(true)
      expect(store.stations.size).toBe(1)
      expect(store.isLoaded).toBe(true)
      expect(store.getStationName('MX')).toBe('Montreux')
    })

    it('should return false when cache is empty', () => {
      const store = useStationsStore()
      const result = store.loadFromCache()

      expect(result).toBe(false)
      expect(store.stations.size).toBe(0)
    })

    it('should handle corrupted cache gracefully', () => {
      localStorage.setItem('stations_cache', 'invalid-json')

      const store = useStationsStore()
      const result = store.loadFromCache()

      expect(result).toBe(false)
      expect(localStorage.getItem('stations_cache')).toBeNull()
    })
  })

  describe('init action', () => {
    it('should load from cache if available', async () => {
      const cached = JSON.stringify([['MX', { id: 1, shortName: 'MX', longName: 'Montreux' }]])
      localStorage.setItem('stations_cache', cached)

      const store = useStationsStore()
      await store.init()

      expect(stationsApi.list).not.toHaveBeenCalled()
      expect(store.stations.size).toBe(1)
    })

    it('should fetch from API when cache is empty', async () => {
      const mockResponse: AxiosResponse<StationsResponse> = {
        data: {
          items: [{ id: 1, shortName: 'MX', longName: 'Montreux' }],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosResponse['config'],
      }
      vi.mocked(stationsApi.list).mockResolvedValue(mockResponse)

      const store = useStationsStore()
      await store.init()

      expect(stationsApi.list).toHaveBeenCalled()
      expect(store.stations.size).toBe(1)
    })

    it('should not re-init if already loaded', async () => {
      const store = useStationsStore()
      store.isLoaded = true

      await store.init()

      expect(stationsApi.list).not.toHaveBeenCalled()
    })
  })

  describe('refresh action', () => {
    it('should fetch from API ignoring cache', async () => {
      const cached = JSON.stringify([['OLD', { id: 1, shortName: 'OLD', longName: 'Old Station' }]])
      localStorage.setItem('stations_cache', cached)

      const mockResponse: AxiosResponse<StationsResponse> = {
        data: {
          items: [{ id: 2, shortName: 'NEW', longName: 'New Station' }],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosResponse['config'],
      }
      vi.mocked(stationsApi.list).mockResolvedValue(mockResponse)

      const store = useStationsStore()
      await store.refresh()

      expect(stationsApi.list).toHaveBeenCalled()
      expect(store.stations.size).toBe(1)
      expect(store.getStationName('NEW')).toBe('New Station')
    })
  })
})
