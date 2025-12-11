<script setup lang="ts">
  import { RouterView, useRouter } from 'vue-router'
  import { watch } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { useStationsStore } from '@/stores/stations'
  import AppNavbar from '@/components/AppNavbar.vue'

  const router = useRouter()
  const authStore = useAuthStore()
  const stationsStore = useStationsStore()

  // Load stations when authenticated
  watch(
    () => authStore.isAuthenticated,
    (isAuth) => {
      if (isAuth && !stationsStore.isLoaded) {
        stationsStore.init()
      }
    },
    { immediate: true }
  )

  async function handleLogout() {
    await authStore.logout()
    router.push('/login')
  }
</script>

<template>
  <v-app>
    <!-- Show loading while checking auth -->
    <v-overlay
      v-if="!authStore.isInitialized"
      :model-value="true"
      class="align-center justify-center"
      aria-label="Chargement de l'application"
    >
      <v-progress-circular indeterminate size="64" color="primary" aria-hidden="true" />
    </v-overlay>

    <template v-else>
      <AppNavbar v-if="authStore.isAuthenticated" @logout="handleLogout" />

      <v-main>
        <RouterView />
      </v-main>
    </template>
  </v-app>
</template>

<style>
  /* Global font family */
  html,
  body,
  .v-application {
    font-family: 'Inter', sans-serif !important;
  }

  /* Typography adjustments */
  .v-application {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Disable uppercase on all buttons */
  .v-btn {
    text-transform: none;
    letter-spacing: 0;
  }

  /* Global focus visible style for accessibility */
  :focus-visible {
    outline: 2px solid #0c0d19;
    outline-offset: 2px;
  }

  /* Override for Vuetify buttons which have their own focus style */
  .v-btn:focus-visible {
    outline: 2px solid #0c0d19;
    outline-offset: 2px;
  }
</style>
