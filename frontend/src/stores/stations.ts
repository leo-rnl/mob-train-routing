import { defineStore } from 'pinia'
import { stationsApi } from '@/services/api'
import type { AxiosError } from 'axios'
import type { ApiError, Station } from '@/types/api'

const STATIONS_CACHE_KEY = 'stations_cache'

interface StationsState {
  stations: Map<string, Station>
  isLoading: boolean
  isLoaded: boolean
  error: string | null
}

// Helper to serialize Map for localStorage
function serializeStations(stations: Map<string, Station>): [string, Station][] {
  return Array.from(stations.entries())
}

// Helper to deserialize from localStorage
function deserializeStations(data: [string, Station][]): Map<string, Station> {
  return new Map(data)
}

export const useStationsStore = defineStore('stations', {
  state: (): StationsState => ({
    stations: new Map(),
    isLoading: false,
    isLoaded: false,
    error: null,
  }),

  getters: {
    /**
     * Get station long name by short name
     * Returns shortName as fallback if not found
     */
    getStationName:
      (state) =>
      (shortName: string): string => {
        return state.stations.get(shortName)?.longName || shortName
      },

    /**
     * Get full station object by short name
     */
    getStation:
      (state) =>
      (shortName: string): Station | undefined => {
        return state.stations.get(shortName)
      },

    /**
     * Get all stations as array (for autocomplete)
     */
    stationsList: (state): Station[] => {
      return Array.from(state.stations.values())
    },
  },

  actions: {
    /**
     * Load stations from localStorage cache
     */
    loadFromCache(): boolean {
      try {
        const cached = localStorage.getItem(STATIONS_CACHE_KEY)
        if (cached) {
          const data = JSON.parse(cached) as [string, Station][]
          this.stations = deserializeStations(data)
          this.isLoaded = true
          return true
        }
      } catch {
        // Cache corrupted, will fetch fresh
        localStorage.removeItem(STATIONS_CACHE_KEY)
      }
      return false
    },

    /**
     * Save stations to localStorage cache
     */
    saveToCache(): void {
      try {
        const data = serializeStations(this.stations)
        localStorage.setItem(STATIONS_CACHE_KEY, JSON.stringify(data))
      } catch {
        // localStorage might be full, ignore
      }
    },

    /**
     * Fetch all stations from API
     */
    async fetchAll(): Promise<void> {
      if (this.isLoading) return

      this.isLoading = true
      this.error = null

      try {
        const { data } = await stationsApi.list({ connected: true })

        this.stations.clear()
        data.items.forEach((station) => {
          this.stations.set(station.shortName, station)
        })

        this.isLoaded = true
        this.saveToCache()
      } catch (e) {
        const error = e as AxiosError<ApiError>
        this.error = error.response?.data?.message || 'Erreur lors du chargement des gares'
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Initialize store: load from cache or fetch
     */
    async init(): Promise<void> {
      if (this.isLoaded) return

      const cached = this.loadFromCache()
      if (!cached) {
        await this.fetchAll()
      }
    },

    /**
     * Force refresh from API (ignore cache)
     */
    async refresh(): Promise<void> {
      await this.fetchAll()
    },
  },
})
