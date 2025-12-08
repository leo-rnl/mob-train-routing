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
      <v-app-bar v-if="authStore.isAuthenticated" color="primary" density="compact">
        <v-toolbar-title class="ml-2">MOB Train Routing</v-toolbar-title>

        <v-spacer />

        <v-btn to="/" variant="text">Accueil</v-btn>
        <v-btn to="/stats" variant="text">Statistiques</v-btn>

        <v-spacer />

        <span class="mr-4 text-body-2">{{ authStore.user?.name }}</span>
        <v-btn variant="outlined" size="small" @click="handleLogout">Déconnexion</v-btn>
      </v-app-bar>

      <v-main>
        <RouterView />
      </v-main>
    </template>
  </v-app>
</template>
