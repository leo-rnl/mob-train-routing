import { createApp } from 'vue'
import { createPinia } from 'pinia'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { fr } from 'vuetify/locale'
import '@mdi/font/css/materialdesignicons.css'

import App from './App.vue'
import router from './router'

// MOB Design System Theme
const mobTheme = {
  dark: false,
  colors: {
    primary: '#001f78',
    secondary: '#d9c89e',
    accent: '#d9c89e',
    error: '#a6142a',
    success: '#78a136',
    warning: '#e8871e',
    info: '#8a8e99',
    'on-primary': '#ffffff',
    'on-secondary': '#2f3137',
    background: '#ffffff',
    surface: '#ffffff',
    'on-background': '#2f3137',
    'on-surface': '#2f3137',
  },
}

const vuetify = createVuetify({
  components,
  directives,
  locale: {
    locale: 'fr',
    messages: { fr },
  },
  theme: {
    defaultTheme: 'mob',
    themes: {
      mob: mobTheme,
    },
  },
  defaults: {
    global: {
      rounded: false, // Disable border radius globally
    },
    VBtn: {
      rounded: 0,
    },
    VCard: {
      rounded: 0,
    },
    VTextField: {
      rounded: 0,
      variant: 'outlined',
    },
    VAutocomplete: {
      rounded: 0,
      variant: 'outlined',
    },
    VSelect: {
      rounded: 0,
      variant: 'outlined',
    },
    VAppBar: {
      rounded: 0,
      flat: true,
    },
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
