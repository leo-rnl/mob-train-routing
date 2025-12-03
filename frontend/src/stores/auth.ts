import { defineStore } from 'pinia'
import { authApi } from '@/services/api'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/api'

const AUTH_TOKEN_KEY = 'auth_token'

interface AuthState {
  token: string | null
  isLoading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem(AUTH_TOKEN_KEY),
    isLoading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.token,
  },

  actions: {
    async login(email: string, password: string): Promise<boolean> {
      this.isLoading = true
      this.error = null

      try {
        const response = await authApi.login({
          email,
          password,
          device_name: 'frontend',
        })

        this.token = response.data.token
        localStorage.setItem(AUTH_TOKEN_KEY, this.token)
        return true
      } catch (e) {
        const error = e as AxiosError<ApiError>
        this.error = error.response?.data?.message || 'Invalid credentials'
        return false
      } finally {
        this.isLoading = false
      }
    },

    logout(): void {
      this.token = null
      this.error = null
      localStorage.removeItem(AUTH_TOKEN_KEY)
    },

    clearError(): void {
      this.error = null
    },

    init(): void {
      this.token = localStorage.getItem(AUTH_TOKEN_KEY)
    },
  },
})
