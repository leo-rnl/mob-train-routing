import { defineStore } from 'pinia'
import { authApi, csrfApi } from '@/services/api'
import type { AxiosError } from 'axios'
import type { ApiError, User } from '@/types/api'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  isInitialized: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isLoading: false,
    error: null,
    isInitialized: false,
  }),

  getters: {
    isAuthenticated: (state): boolean => state.user !== null,
  },

  actions: {
    async login(email: string, password: string): Promise<boolean> {
      this.isLoading = true
      this.error = null

      try {
        // 1. Get CSRF cookie from Sanctum
        await csrfApi.getCookie()

        // 2. Login with session
        const response = await authApi.login({ email, password })

        this.user = response.data.user
        return true
      } catch (e) {
        const error = e as AxiosError<ApiError>
        this.error = error.response?.data?.message || 'Invalid credentials'
        return false
      } finally {
        this.isLoading = false
      }
    },

    async logout(): Promise<void> {
      try {
        await authApi.logout()
      } catch {
        // Ignore logout errors
      } finally {
        this.user = null
        this.error = null
      }
    },

    async checkAuth(): Promise<void> {
      this.isLoading = true
      try {
        const response = await authApi.user()
        this.user = response.data.user
      } catch {
        this.user = null
      } finally {
        this.isLoading = false
        this.isInitialized = true
      }
    },

    clearError(): void {
      this.error = null
    },
  },
})
