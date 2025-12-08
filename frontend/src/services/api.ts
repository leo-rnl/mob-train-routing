import axios from 'axios'
import type {
  LoginRequest,
  LoginResponse,
  UserResponse,
  StationsParams,
  StationsResponse,
  CreateRouteRequest,
  Route,
  RoutesListParams,
  RoutesListResponse,
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
  withCredentials: true,
  withXSRFToken: true,
})

// ============================================================================
// Response Interceptor - Handle 401 Unauthorized and 419 CSRF Token Mismatch
// ============================================================================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 419) {
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ============================================================================
// CSRF Cookie - Must be called before login
// ============================================================================

const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'

export const csrfApi = {
  getCookie: () =>
    axios.get(`${baseUrl}/sanctum/csrf-cookie`, {
      withCredentials: true,
    }),
}

// ============================================================================
// API Methods
// ============================================================================

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/login', data),
  logout: () => api.post('/logout'),
  user: () => api.get<UserResponse>('/user'),
}

export const stationsApi = {
  list: (params?: StationsParams) => api.get<StationsResponse>('/stations', { params }),
}

export const routesApi = {
  create: (data: CreateRouteRequest) => api.post<Route>('/routes', data),
  list: (params?: RoutesListParams) => api.get<RoutesListResponse>('/routes', { params }),
}

export const statsApi = {
  distances: (params?: StatsParams) => api.get<StatsResponse>('/stats/distances', { params }),
}

export default api
