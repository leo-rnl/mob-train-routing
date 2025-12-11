import { config } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Mock HTMLCanvasElement.getContext to suppress chart.js warnings in jsdom
HTMLCanvasElement.prototype.getContext = () => null

// Polyfills for browser APIs used by Vuetify but not available in JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 0)
}

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id)
}

const vuetify = createVuetify({
  components,
  directives,
})

config.global.plugins = [vuetify]
