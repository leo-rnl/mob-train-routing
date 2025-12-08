import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { authApi, csrfApi } from '@/services/api'
import type { AxiosResponse, AxiosError } from 'axios'
import type { LoginResponse, UserResponse, ApiError } from '@/types/api'

// Mock the API module
vi.mock('@/services/api', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    user: vi.fn(),
  },
  csrfApi: {
    getCookie: vi.fn(),
  },
}))

const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' }

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Initial state', () => {
    it('should initialize with null user', () => {
      const store = useAuthStore()

      expect(store.user).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.isInitialized).toBe(false)
    })
  })

  describe('isAuthenticated getter', () => {
    it('should return true when user exists', () => {
      const store = useAuthStore()
      store.user = mockUser

      expect(store.isAuthenticated).toBe(true)
    })

    it('should return false when user is null', () => {
      const store = useAuthStore()

      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('login action', () => {
    it('should get CSRF cookie and store user on successful login', async () => {
      vi.mocked(csrfApi.getCookie).mockResolvedValue({} as AxiosResponse)
      const mockResponse: AxiosResponse<LoginResponse> = {
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosResponse['config'],
      }
      vi.mocked(authApi.login).mockResolvedValue(mockResponse)

      const store = useAuthStore()
      const result = await store.login('test@example.com', 'password')

      expect(result).toBe(true)
      expect(csrfApi.getCookie).toHaveBeenCalled()
      expect(store.user).toEqual(mockUser)
      expect(store.isAuthenticated).toBe(true)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should call authApi.login with correct parameters', async () => {
      vi.mocked(csrfApi.getCookie).mockResolvedValue({} as AxiosResponse)
      const mockResponse: AxiosResponse<LoginResponse> = {
        data: { user: mockUser },
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
      })
    })

    it('should set isLoading during login process', async () => {
      vi.mocked(csrfApi.getCookie).mockResolvedValue({} as AxiosResponse)
      let resolveLogin: (value: AxiosResponse<LoginResponse>) => void
      const loginPromise = new Promise<AxiosResponse<LoginResponse>>((resolve) => {
        resolveLogin = resolve
      })
      vi.mocked(authApi.login).mockReturnValue(loginPromise)

      const store = useAuthStore()
      const loginCall = store.login('test@example.com', 'password')

      expect(store.isLoading).toBe(true)

      resolveLogin!({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosResponse['config'],
      })

      await loginCall

      expect(store.isLoading).toBe(false)
    })

    it('should set error and return false on failed login', async () => {
      vi.mocked(csrfApi.getCookie).mockResolvedValue({} as AxiosResponse)
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
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.error).toBe('Invalid credentials')
      expect(store.isLoading).toBe(false)
    })

    it('should use default error message when response has no message', async () => {
      vi.mocked(csrfApi.getCookie).mockResolvedValue({} as AxiosResponse)
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
      vi.mocked(csrfApi.getCookie).mockResolvedValue({} as AxiosResponse)
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
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosResponse['config'],
      })

      await loginCall
    })
  })

  describe('logout action', () => {
    it('should call API and clear user', async () => {
      vi.mocked(authApi.logout).mockResolvedValue({} as AxiosResponse)
      const store = useAuthStore()
      store.user = mockUser

      await store.logout()

      expect(authApi.logout).toHaveBeenCalled()
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('should clear user even if API call fails', async () => {
      vi.mocked(authApi.logout).mockRejectedValue(new Error('Network error'))
      const store = useAuthStore()
      store.user = mockUser

      await store.logout()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('should clear error on logout', async () => {
      vi.mocked(authApi.logout).mockResolvedValue({} as AxiosResponse)
      const store = useAuthStore()
      store.error = 'Some error'

      await store.logout()

      expect(store.error).toBeNull()
    })
  })

  describe('checkAuth action', () => {
    it('should set user when session is valid', async () => {
      const mockResponse: AxiosResponse<UserResponse> = {
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosResponse['config'],
      }
      vi.mocked(authApi.user).mockResolvedValue(mockResponse)

      const store = useAuthStore()
      await store.checkAuth()

      expect(store.user).toEqual(mockUser)
      expect(store.isAuthenticated).toBe(true)
      expect(store.isLoading).toBe(false)
      expect(store.isInitialized).toBe(true)
    })

    it('should clear user when session is invalid', async () => {
      vi.mocked(authApi.user).mockRejectedValue(new Error('Unauthorized'))

      const store = useAuthStore()
      store.user = mockUser
      await store.checkAuth()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.isLoading).toBe(false)
      expect(store.isInitialized).toBe(true)
    })

    it('should set isLoading during check', async () => {
      let resolveUser: (value: AxiosResponse<UserResponse>) => void
      const userPromise = new Promise<AxiosResponse<UserResponse>>((resolve) => {
        resolveUser = resolve
      })
      vi.mocked(authApi.user).mockReturnValue(userPromise)

      const store = useAuthStore()
      const checkCall = store.checkAuth()

      expect(store.isLoading).toBe(true)
      expect(store.isInitialized).toBe(false)

      resolveUser!({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosResponse['config'],
      })

      await checkCall

      expect(store.isLoading).toBe(false)
      expect(store.isInitialized).toBe(true)
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
})
