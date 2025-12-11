<script setup lang="ts">
  import { useRoute } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const route = useRoute()
  const authStore = useAuthStore()

  defineEmits<{
    (e: 'logout'): void
  }>()
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <router-link to="/" class="navbar-logo ml-4" aria-label="Accueil">
      <span class="navbar-logo__mob">MOB</span>
      <span class="navbar-logo__main">Train Routing</span>
    </router-link>

    <v-spacer />

    <nav class="d-flex align-center">
      <v-btn
        to="/"
        variant="text"
        class="nav-link mx-1"
        :class="{ 'nav-link--active': route.name === 'home' }"
      >
        Accueil
      </v-btn>
      <v-btn
        to="/stats"
        variant="text"
        class="nav-link mx-1"
        :class="{ 'nav-link--active': route.name === 'stats' }"
      >
        Statistiques
      </v-btn>
    </nav>

    <v-spacer />

    <v-menu offset-y>
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          variant="plain"
          class="user-menu-btn mr-2"
          aria-label="Menu utilisateur"
        >
          <v-icon size="small" class="mr-2" aria-hidden="true">mdi-account-circle</v-icon>
          <span class="text-body-2 font-weight-medium">{{ authStore.user?.name }}</span>
          <v-icon size="small" class="ml-1" aria-hidden="true">mdi-chevron-down</v-icon>
        </v-btn>
      </template>
      <v-list density="compact" min-width="160">
        <v-list-item class="text-medium-emphasis">
          <v-list-item-subtitle>{{ authStore.user?.email }}</v-list-item-subtitle>
        </v-list-item>
        <v-divider />
        <v-list-item @click="$emit('logout')">
          <template #prepend>
            <v-icon size="small" aria-hidden="true">mdi-logout</v-icon>
          </template>
          <v-list-item-title>Déconnexion</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<style scoped>
  .navbar-logo {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-decoration: none;
    line-height: 1.1;
  }

  .navbar-logo__mob {
    font-size: 0.5rem;
    font-weight: 600;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: rgb(var(--v-theme-secondary));
  }

  .navbar-logo__main {
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgb(var(--v-theme-on-primary));
  }

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

  .user-menu-btn {
    font-weight: 500;
  }
</style>
