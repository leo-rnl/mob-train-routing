import axios from 'axios'
import type {
  LoginRequest,
  LoginResponse,
  StationsParams,
  StationsResponse,
  CreateRouteRequest,
  Route,
  StatsParams,
  StatsResponse,
} from '@/types/api'

// ============================================================================
// Axios Instance Configuration
// ============================================================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// ============================================================================
// Request Interceptor - Add Authorization header
// ============================================================================

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ============================================================================
// Response Interceptor - Handle 401 Unauthorized
// ============================================================================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ============================================================================
// API Methods
// ============================================================================

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/token', data),
}

export const stationsApi = {
  list: (params?: StationsParams) => api.get<StationsResponse>('/stations', { params }),
}

export const routesApi = {
  create: (data: CreateRouteRequest) => api.post<Route>('/routes', data),
}

export const statsApi = {
  distances: (params?: StatsParams) => api.get<StatsResponse>('/stats/distances', { params }),
}

export default api
