// ============================================================================
// API Types - TypeScript contracts for MOB Train Routing API
// ============================================================================

// === Auth ===

export interface LoginRequest {
  email: string
  password: string
  device_name: string
}

export interface LoginResponse {
  token: string
  expiresAt: string | null
}

// === Stations ===

export interface Station {
  id: number
  shortName: string
  longName: string
}

export interface StationsResponse {
  items: Station[]
}

export interface StationsParams {
  search?: string
  connected?: boolean
}

// === Routes ===

export interface CreateRouteRequest {
  fromStationId: string
  toStationId: string
  analyticCode: string
}

export interface Route {
  id: string
  fromStationId: string
  toStationId: string
  analyticCode: string
  distanceKm: number
  path: string[]
  createdAt: string
}

// === Stats ===

export type GroupBy = 'none' | 'day' | 'month' | 'year'

export interface StatsParams {
  from?: string
  to?: string
  groupBy?: GroupBy
}

export interface DistanceStat {
  analyticCode: string
  totalDistanceKm: number
  periodStart?: string
  periodEnd?: string
  group?: string
}

export interface StatsResponse {
  from: string | null
  to: string | null
  groupBy: string
  items: DistanceStat[]
}

// === Errors ===

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
