<script setup lang="ts">
  import { RouterView, useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const authStore = useAuthStore()

  function handleLogout() {
    authStore.logout()
    router.push('/login')
  }
</script>

<template>
  <v-app>
    <v-app-bar v-if="authStore.isAuthenticated" color="primary" density="compact">
      <v-toolbar-title class="ml-2">MOB Train Routing</v-toolbar-title>

      <v-spacer />

      <v-btn to="/" variant="text">Accueil</v-btn>
      <v-btn to="/stats" variant="text">Statistiques</v-btn>

      <v-spacer />

      <v-btn variant="outlined" size="small" @click="handleLogout">Déconnexion</v-btn>
    </v-app-bar>

    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>
