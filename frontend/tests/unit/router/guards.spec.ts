import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { defineComponent } from 'vue'

// Mock API to prevent actual axios calls during store import
vi.mock('@/services/api', () => ({
  authApi: {
    login: vi.fn(),
  },
}))

// Simple test components (eslint-disable for test mocks)
// eslint-disable-next-line vue/one-component-per-file
const HomeView = defineComponent({ template: '<div>Home</div>' })
// eslint-disable-next-line vue/one-component-per-file
const LoginView = defineComponent({ template: '<div>Login</div>' })

// Helper to create a fresh router with guards
function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        name: 'home',
        component: HomeView,
        meta: { requiresAuth: true },
      },
      {
        path: '/login',
        name: 'login',
        component: LoginView,
        meta: { guest: true },
      },
      {
        path: '/public',
        name: 'public',
        component: HomeView,
        meta: {},
      },
    ],
  })

  // Add the navigation guard
  router.beforeEach((to, _from, next) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      next({
        name: 'login',
        query: { redirect: to.fullPath },
      })
      return
    }

    if (to.meta.guest && authStore.isAuthenticated) {
      next({ name: 'home' })
      return
    }

    next()
  })

  return router
}

describe('Router Guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Protected routes (requiresAuth)', () => {
    it('should redirect to login when not authenticated', async () => {
      const router = createTestRouter()
      await router.push('/')

      expect(router.currentRoute.value.name).toBe('login')
      expect(router.currentRoute.value.query.redirect).toBe('/')
    })

    it('should preserve redirect path in query', async () => {
      const router = createTestRouter()
      await router.push('/?param=value')

      expect(router.currentRoute.value.name).toBe('login')
      expect(router.currentRoute.value.query.redirect).toBe('/?param=value')
    })

    it('should allow access when authenticated', async () => {
      localStorage.setItem('auth_token', 'valid-token')
      const router = createTestRouter()
      await router.push('/')

      expect(router.currentRoute.value.name).toBe('home')
    })
  })

  describe('Guest routes', () => {
    it('should allow access when not authenticated', async () => {
      const router = createTestRouter()
      await router.push('/login')

      expect(router.currentRoute.value.name).toBe('login')
    })

    it('should redirect to home when authenticated', async () => {
      localStorage.setItem('auth_token', 'valid-token')
      const router = createTestRouter()
      await router.push('/login')

      expect(router.currentRoute.value.name).toBe('home')
    })
  })

  describe('Public routes (no meta)', () => {
    it('should allow access when not authenticated', async () => {
      const router = createTestRouter()
      await router.push('/public')

      expect(router.currentRoute.value.name).toBe('public')
    })

    it('should allow access when authenticated', async () => {
      localStorage.setItem('auth_token', 'valid-token')
      const router = createTestRouter()
      await router.push('/public')

      expect(router.currentRoute.value.name).toBe('public')
    })
  })

  describe('Navigation between routes', () => {
    it('should allow navigation from login to home after login', async () => {
      const router = createTestRouter()
      await router.push('/login')

      expect(router.currentRoute.value.name).toBe('login')

      // Simulate login
      localStorage.setItem('auth_token', 'new-token')
      useAuthStore().token = 'new-token'

      await router.push('/')

      expect(router.currentRoute.value.name).toBe('home')
    })

    it('should redirect from protected route to login after logout', async () => {
      localStorage.setItem('auth_token', 'valid-token')
      const router = createTestRouter()
      const authStore = useAuthStore()

      await router.push('/')
      expect(router.currentRoute.value.name).toBe('home')

      // Simulate logout
      authStore.logout()

      // Navigate to public route first, then try protected route
      await router.push('/public')
      expect(router.currentRoute.value.name).toBe('public')

      await router.push('/')
      expect(router.currentRoute.value.name).toBe('login')
    })
  })
})
