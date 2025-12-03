import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

// Mock axios before importing api module
vi.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    post: vi.fn(),
    get: vi.fn(),
  }

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  }
})

describe('API Service', () => {
  let mockAxiosInstance: AxiosInstance
  let requestInterceptor: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig
  let responseSuccessInterceptor: (response: AxiosResponse) => AxiosResponse
  let responseErrorInterceptor: (error: AxiosError) => Promise<never>

  beforeEach(async () => {
    vi.clearAllMocks()
    localStorage.clear()

    // Reset modules to get fresh import
    vi.resetModules()

    // Re-import to capture interceptors
    await import('@/services/api')

    mockAxiosInstance = (axios.create as ReturnType<typeof vi.fn>).mock.results[0].value

    // Capture interceptors
    const requestUse = mockAxiosInstance.interceptors.request.use as ReturnType<typeof vi.fn>
    const responseUse = mockAxiosInstance.interceptors.response.use as ReturnType<typeof vi.fn>

    requestInterceptor = requestUse.mock.calls[0][0]
    responseSuccessInterceptor = responseUse.mock.calls[0][0]
    responseErrorInterceptor = responseUse.mock.calls[0][1]
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Axios instance configuration', () => {
    it('should create axios instance with correct config', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8000/api/v1',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
    })
  })

  describe('Request interceptor', () => {
    it('should add Authorization header when token exists', () => {
      localStorage.setItem('auth_token', 'test-token-123')

      const config = {
        headers: {},
      } as InternalAxiosRequestConfig

      const result = requestInterceptor(config)

      expect(result.headers.Authorization).toBe('Bearer test-token-123')
    })

    it('should not add Authorization header when token is absent', () => {
      const config = {
        headers: {},
      } as InternalAxiosRequestConfig

      const result = requestInterceptor(config)

      expect(result.headers.Authorization).toBeUndefined()
    })
  })

  describe('Response interceptor', () => {
    it('should pass through successful responses', () => {
      const response = { data: { success: true } } as AxiosResponse

      const result = responseSuccessInterceptor(response)

      expect(result).toBe(response)
    })

    it('should clear token and redirect on 401 error', async () => {
      localStorage.setItem('auth_token', 'test-token')

      // Mock window.location
      const originalLocation = window.location
      Object.defineProperty(window, 'location', {
        value: { pathname: '/home', href: '' },
        writable: true,
      })

      const error = {
        response: { status: 401 },
      } as AxiosError

      await expect(responseErrorInterceptor(error)).rejects.toBe(error)

      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(window.location.href).toBe('/login')

      // Restore
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      })
    })

    it('should not redirect if already on login page', async () => {
      localStorage.setItem('auth_token', 'test-token')

      const originalLocation = window.location
      Object.defineProperty(window, 'location', {
        value: { pathname: '/login', href: '' },
        writable: true,
      })

      const error = {
        response: { status: 401 },
      } as AxiosError

      await expect(responseErrorInterceptor(error)).rejects.toBe(error)

      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(window.location.href).toBe('') // Should not change

      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      })
    })

    it('should pass through non-401 errors', async () => {
      const error = {
        response: { status: 500 },
      } as AxiosError

      await expect(responseErrorInterceptor(error)).rejects.toBe(error)
    })
  })

  describe('API methods', () => {
    it('should export authApi with login method', async () => {
      const { authApi } = await import('@/services/api')
      expect(authApi.login).toBeDefined()
    })

    it('should export stationsApi with list method', async () => {
      const { stationsApi } = await import('@/services/api')
      expect(stationsApi.list).toBeDefined()
    })

    it('should export routesApi with create method', async () => {
      const { routesApi } = await import('@/services/api')
      expect(routesApi.create).toBeDefined()
    })

    it('should export statsApi with distances method', async () => {
      const { statsApi } = await import('@/services/api')
      expect(statsApi.distances).toBeDefined()
    })
  })
})
