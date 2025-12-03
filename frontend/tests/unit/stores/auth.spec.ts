import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/services/api'
import type { AxiosResponse, AxiosError } from 'axios'
import type { LoginResponse, ApiError } from '@/types/api'

// Mock the API module
vi.mock('@/services/api', () => ({
  authApi: {
    login: vi.fn(),
  },
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Initial state', () => {
    it('should initialize with null token when localStorage is empty', () => {
      const store = useAuthStore()

      expect(store.token).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should initialize with token from localStorage', () => {
      localStorage.setItem('auth_token', 'existing-token')

      const store = useAuthStore()

      expect(store.token).toBe('existing-token')
    })
  })

  describe('isAuthenticated getter', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('auth_token', 'test-token')
      const store = useAuthStore()

      expect(store.isAuthenticated).toBe(true)
    })

    it('should return false when token is null', () => {
      const store = useAuthStore()

      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('login action', () => {
    it('should store token and update state on successful login', async () => {
      const mockResponse: AxiosResponse<LoginResponse> = {
        data: { token: 'new-token-123', expiresAt: null },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosResponse['config'],
      }
      vi.mocked(authApi.login).mockResolvedValue(mockResponse)

      const store = useAuthStore()
      const result = await store.login('test@example.com', 'password')

      expect(result).toBe(true)
      expect(store.token).toBe('new-token-123')
      expect(store.isAuthenticated).toBe(true)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
      expect(localStorage.getItem('auth_token')).toBe('new-token-123')
    })

    it('should call authApi.login with correct parameters', async () => {
      const mockResponse: AxiosResponse<LoginResponse> = {
        data: { token: 'token', expiresAt: null },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosResponse['config'],
      }
      vi.mocked(authApi.login).mockResolvedValue(mockResponse)

      const store = useAuthStore()
      await store.login('user@test.com', 'secret123')

      expect(authApi.login).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'secret123',
        device_name: 'frontend',
      })
    })

    it('should set isLoading during login process', async () => {
      let resolveLogin: (value: AxiosResponse<LoginResponse>) => void
      const loginPromise = new Promise<AxiosResponse<LoginResponse>>((resolve) => {
        resolveLogin = resolve
      })
      vi.mocked(authApi.login).mockReturnValue(loginPromise)

      const store = useAuthStore()
      const loginCall = store.login('test@example.com', 'password')

      expect(store.isLoading).toBe(true)

      resolveLogin!({
        data: { token: 'token', expiresAt: null },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosResponse['config'],
      })

      await loginCall

      expect(store.isLoading).toBe(false)
    })

    it('should set error and return false on failed login', async () => {
      const mockError: AxiosError<ApiError> = {
        response: {
          data: { message: 'Invalid credentials' },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config: {} as AxiosResponse['config'],
        },
        isAxiosError: true,
        toJSON: () => ({}),
        name: 'AxiosError',
        message: 'Request failed',
      } as AxiosError<ApiError>
      vi.mocked(authApi.login).mockRejectedValue(mockError)

      const store = useAuthStore()
      const result = await store.login('test@example.com', 'wrong-password')

      expect(result).toBe(false)
      expect(store.token).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.error).toBe('Invalid credentials')
      expect(store.isLoading).toBe(false)
    })

    it('should use default error message when response has no message', async () => {
      const mockError: AxiosError = {
        response: undefined,
        isAxiosError: true,
        toJSON: () => ({}),
        name: 'AxiosError',
        message: 'Network error',
      } as AxiosError
      vi.mocked(authApi.login).mockRejectedValue(mockError)

      const store = useAuthStore()
      await store.login('test@example.com', 'password')

      expect(store.error).toBe('Invalid credentials')
    })

    it('should clear previous error on new login attempt', async () => {
      const mockError: AxiosError<ApiError> = {
        response: {
          data: { message: 'First error' },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config: {} as AxiosResponse['config'],
        },
        isAxiosError: true,
        toJSON: () => ({}),
        name: 'AxiosError',
        message: 'Request failed',
      } as AxiosError<ApiError>
      vi.mocked(authApi.login).mockRejectedValue(mockError)

      const store = useAuthStore()
      await store.login('test@example.com', 'wrong')

      expect(store.error).toBe('First error')

      // Second attempt clears the error initially
      let resolveLogin: (value: AxiosResponse<LoginResponse>) => void
      const loginPromise = new Promise<AxiosResponse<LoginResponse>>((resolve) => {
        resolveLogin = resolve
      })
      vi.mocked(authApi.login).mockReturnValue(loginPromise)

      const loginCall = store.login('test@example.com', 'password')

      expect(store.error).toBeNull()

      resolveLogin!({
        data: { token: 'token', expiresAt: null },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosResponse['config'],
      })

      await loginCall
    })
  })

  describe('logout action', () => {
    it('should clear token and localStorage', () => {
      localStorage.setItem('auth_token', 'test-token')
      const store = useAuthStore()
      store.token = 'test-token'

      store.logout()

      expect(store.token).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(localStorage.getItem('auth_token')).toBeNull()
    })

    it('should clear error on logout', () => {
      const store = useAuthStore()
      store.error = 'Some error'

      store.logout()

      expect(store.error).toBeNull()
    })
  })

  describe('clearError action', () => {
    it('should clear the error', () => {
      const store = useAuthStore()
      store.error = 'Some error'

      store.clearError()

      expect(store.error).toBeNull()
    })
  })

  describe('init action', () => {
    it('should hydrate token from localStorage', () => {
      const store = useAuthStore()
      store.token = null

      localStorage.setItem('auth_token', 'hydrated-token')
      store.init()

      expect(store.token).toBe('hydrated-token')
    })

    it('should set token to null if localStorage is empty', () => {
      localStorage.setItem('auth_token', 'initial-token')
      const store = useAuthStore()

      localStorage.removeItem('auth_token')
      store.init()

      expect(store.token).toBeNull()
    })
  })
})
