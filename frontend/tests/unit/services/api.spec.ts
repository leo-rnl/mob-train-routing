import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

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
      get: vi.fn(),
    },
  }
})

describe('API Service', () => {
  let mockAxiosInstance: AxiosInstance
  let responseSuccessInterceptor: (response: AxiosResponse) => AxiosResponse
  let responseErrorInterceptor: (error: AxiosError) => Promise<never>

  beforeEach(async () => {
    vi.clearAllMocks()

    // Reset modules to get fresh import
    vi.resetModules()

    // Re-import to capture interceptors
    await import('@/services/api')

    mockAxiosInstance = (axios.create as ReturnType<typeof vi.fn>).mock.results[0].value

    // Capture interceptors
    const responseUse = mockAxiosInstance.interceptors.response.use as ReturnType<typeof vi.fn>

    responseSuccessInterceptor = responseUse.mock.calls[0][0]
    responseErrorInterceptor = responseUse.mock.calls[0][1]
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Axios instance configuration', () => {
    it('should create axios instance with correct config', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8000/api/v1',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        withCredentials: true,
        withXSRFToken: true,
      })
    })
  })

  describe('Response interceptor', () => {
    it('should pass through successful responses', () => {
      const response = { data: { success: true } } as AxiosResponse

      const result = responseSuccessInterceptor(response)

      expect(result).toBe(response)
    })

    it('should redirect on 401 error', async () => {
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

      expect(window.location.href).toBe('/login')

      // Restore
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      })
    })

    it('should redirect on 419 CSRF token mismatch', async () => {
      const originalLocation = window.location
      Object.defineProperty(window, 'location', {
        value: { pathname: '/home', href: '' },
        writable: true,
      })

      const error = {
        response: { status: 419 },
      } as AxiosError

      await expect(responseErrorInterceptor(error)).rejects.toBe(error)

      expect(window.location.href).toBe('/login')

      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      })
    })

    it('should not redirect if already on login page', async () => {
      const originalLocation = window.location
      Object.defineProperty(window, 'location', {
        value: { pathname: '/login', href: '' },
        writable: true,
      })

      const error = {
        response: { status: 401 },
      } as AxiosError

      await expect(responseErrorInterceptor(error)).rejects.toBe(error)

      expect(window.location.href).toBe('') // Should not change

      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      })
    })

    it('should pass through non-401/419 errors', async () => {
      const error = {
        response: { status: 500 },
      } as AxiosError

      await expect(responseErrorInterceptor(error)).rejects.toBe(error)
    })
  })

  describe('API methods', () => {
    it('should export authApi with login, logout, and user methods', async () => {
      const { authApi } = await import('@/services/api')
      expect(authApi.login).toBeDefined()
      expect(authApi.logout).toBeDefined()
      expect(authApi.user).toBeDefined()
    })

    it('should export csrfApi with getCookie method', async () => {
      const { csrfApi } = await import('@/services/api')
      expect(csrfApi.getCookie).toBeDefined()
    })

    it('should export stationsApi with list method', async () => {
      const { stationsApi } = await import('@/services/api')
      expect(stationsApi.list).toBeDefined()
    })

    it('should export routesApi with create and list methods', async () => {
      const { routesApi } = await import('@/services/api')
      expect(routesApi.create).toBeDefined()
      expect(routesApi.list).toBeDefined()
    })

    it('should export statsApi with distances method', async () => {
      const { statsApi } = await import('@/services/api')
      expect(statsApi.distances).toBeDefined()
    })
  })
})
