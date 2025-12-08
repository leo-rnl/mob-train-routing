<script setup lang="ts">
  import { RouterView, useRouter } from 'vue-router'
  import { watch } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { useStationsStore } from '@/stores/stations'

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
    >
      <v-progress-circular indeterminate size="64" color="primary" />
    </v-overlay>

    <template v-else>
      <v-app-bar v-if="authStore.isAuthenticated" color="primary" density="comfortable">
        <v-toolbar-title class="ml-4 font-weight-bold">MOB Train Routing</v-toolbar-title>

        <v-spacer />

        <nav class="d-flex align-center">
          <v-btn
            to="/"
            variant="text"
            class="nav-link mx-1"
            :class="{ 'nav-link--active': $route.name === 'home' }"
          >
            Accueil
          </v-btn>
          <v-btn
            to="/stats"
            variant="text"
            class="nav-link mx-1"
            :class="{ 'nav-link--active': $route.name === 'stats' }"
          >
            Statistiques
          </v-btn>
        </nav>

        <v-spacer />

        <div class="d-flex align-center mr-4">
          <v-icon size="small" class="mr-2">mdi-account</v-icon>
          <span class="text-body-2 font-weight-medium">{{ authStore.user?.name }}</span>
        </div>
        <v-btn variant="outlined" size="small" class="mr-4 logout-btn" @click="handleLogout">
          Déconnexion
        </v-btn>
      </v-app-bar>

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
</style>

<style scoped>
  /* Navigation links */
  .nav-link {
    font-weight: 500;
    opacity: 0.85;
  }

  .nav-link:hover {
    opacity: 1;
  }

  .nav-link--active {
    opacity: 1;
    border-bottom: 2px solid rgb(var(--v-theme-secondary));
  }

  /* Logout button */
  .logout-btn {
    font-weight: 500;
    border-color: rgba(255, 255, 255, 0.5);
  }

  .logout-btn:hover {
    border-color: rgba(255, 255, 255, 1);
    background-color: rgba(255, 255, 255, 0.1);
  }
</style>
