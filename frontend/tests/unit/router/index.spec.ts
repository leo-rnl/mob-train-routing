import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock API to prevent actual axios calls
vi.mock('@/services/api', () => ({
  authApi: {
    login: vi.fn(),
  },
}))

describe('Router Configuration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.resetModules()
  })

  afterEach(() => {
    localStorage.clear()
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
    localStorage.setItem('auth_token', 'test-token')
    const { default: router } = await import('@/router/index')

    await router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('home')
  })

  it('should redirect authenticated user from login to home', async () => {
    localStorage.setItem('auth_token', 'test-token')
    const { default: router } = await import('@/router/index')

    await router.push('/login')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('home')
  })
})
