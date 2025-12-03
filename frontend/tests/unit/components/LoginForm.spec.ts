import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import LoginForm from '@/components/LoginForm.vue'
import { useAuthStore } from '@/stores/auth'

// Mock the API
vi.mock('@/services/api', () => ({
  authApi: {
    login: vi.fn(),
  },
}))

describe('LoginForm', () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
    ],
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  function mountComponent() {
    return mount(LoginForm, {
      global: {
        plugins: [router],
      },
    })
  }

  it('renders email and password fields', () => {
    const wrapper = mountComponent()

    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('renders submit button', () => {
    const wrapper = mountComponent()

    const button = wrapper.find('button[type="submit"]')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Se connecter')
  })

  it('disables submit button when form is empty', () => {
    const wrapper = mountComponent()

    const button = wrapper.find('button[type="submit"]')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('enables submit button when form is valid', async () => {
    const wrapper = mountComponent()

    const emailInput = wrapper.find('input[type="email"]')
    const passwordInput = wrapper.find('input[type="password"]')

    await emailInput.setValue('test@example.com')
    await passwordInput.setValue('password123')
    await flushPromises()

    const button = wrapper.find('button[type="submit"]')
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('calls authStore.login on submit', async () => {
    const wrapper = mountComponent()
    const authStore = useAuthStore()
    const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue(true)

    const emailInput = wrapper.find('input[type="email"]')
    const passwordInput = wrapper.find('input[type="password"]')

    await emailInput.setValue('test@example.com')
    await passwordInput.setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(loginSpy).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('displays error when login fails', async () => {
    const wrapper = mountComponent()
    const authStore = useAuthStore()
    authStore.error = 'Invalid credentials'

    await flushPromises()

    expect(wrapper.text()).toContain('Invalid credentials')
  })

  it('shows loading state during login', async () => {
    const wrapper = mountComponent()
    const authStore = useAuthStore()
    authStore.isLoading = true

    await flushPromises()

    const button = wrapper.find('button[type="submit"]')
    expect(button.attributes('disabled')).toBeDefined()
  })
})
