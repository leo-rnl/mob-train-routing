import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { authApi } from '@/services/api'

// Mock API to prevent actual axios calls
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

describe('Router Configuration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetModules()
    vi.clearAllMocks()
    // Default: unauthenticated (API returns error)
    vi.mocked(authApi.user).mockRejectedValue(new Error('Unauthenticated'))
  })

  it('should export a router instance', async () => {
    const { default: router } = await import('@/router/index')

    expect(router).toBeDefined()
    expect(router.getRoutes).toBeDefined()
  })

  it('should have home route with requiresAuth meta', async () => {
    const { default: router } = await import('@/router/index')

    const homeRoute = router.getRoutes().find((r) => r.name === 'home')

    expect(homeRoute).toBeDefined()
    expect(homeRoute?.meta.requiresAuth).toBe(true)
  })

  it('should have login route with guest meta', async () => {
    const { default: router } = await import('@/router/index')

    const loginRoute = router.getRoutes().find((r) => r.name === 'login')

    expect(loginRoute).toBeDefined()
    expect(loginRoute?.meta.guest).toBe(true)
  })

  it('should redirect unauthenticated user from home to login', async () => {
    const { default: router } = await import('@/router/index')

    await router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('login')
  })

  it('should allow authenticated user to access home', async () => {
    // Mock API to return authenticated user
    vi.mocked(authApi.user).mockResolvedValue({
      data: { user: mockUser },
    } as never)

    const { default: router } = await import('@/router/index')

    await router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('home')
  })

  it('should redirect authenticated user from login to home', async () => {
    // Mock API to return authenticated user
    vi.mocked(authApi.user).mockResolvedValue({
      data: { user: mockUser },
    } as never)

    const { default: router } = await import('@/router/index')

    await router.push('/login')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('home')
  })
})
