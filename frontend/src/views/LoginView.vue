<script setup lang="ts">
  import LoginForm from '@/components/LoginForm.vue'
</script>

<template>
  <div class="login-layout">
    <!-- Left panel: Form -->
    <main class="login-layout__main">
      <div class="login-layout__main-content">
        <h1 class="text-h5 font-weight-bold mb-6">Connexion</h1>
        <LoginForm />
      </div>
    </main>

    <!-- Right panel: Branding -->
    <aside class="login-layout__aside">
      <div class="login-layout__aside-content">
        <v-icon size="80" color="white" class="mb-6">mdi-train</v-icon>
        <h2 class="text-h3 font-weight-bold mb-4">MOB Train Routing</h2>
        <p class="text-h6 font-weight-light login-layout__tagline">
          Des Alpes au Léman, optimisez vos trajets ferroviaires sur le réseau Montreux-Oberland
          Bernois.
        </p>
        <div class="login-layout__stats mt-8">
          <div class="login-layout__stat">
            <span class="text-h4 font-weight-bold">86</span>
            <span class="text-body-2">stations</span>
          </div>
          <div class="login-layout__stat">
            <span class="text-h4 font-weight-bold">2</span>
            <span class="text-body-2">lignes</span>
          </div>
          <div class="login-layout__stat">
            <span class="text-h4 font-weight-bold">63</span>
            <span class="text-body-2">km de voies</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
  .login-layout {
    display: flex;
    min-height: 100vh;
  }

  /* Left panel - Form */
  .login-layout__main {
    flex: 0 0 50%;
    max-width: 600px;
    min-width: 400px;
    background-color: rgb(var(--v-theme-surface));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-layout__main-content {
    padding: 40px;
    width: 100%;
    max-width: 400px;
  }

  /* Right panel - Branding */
  .login-layout__aside {
    flex: 1;
    background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, #001247 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-layout__aside-content {
    padding: 40px;
    max-width: 500px;
    text-align: center;
  }

  .login-layout__tagline {
    opacity: 0.9;
    line-height: 1.6;
  }

  .login-layout__stats {
    display: flex;
    justify-content: center;
    gap: 48px;
  }

  .login-layout__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    opacity: 0.9;
  }

  /* Responsive: stack on mobile */
  @media (max-width: 960px) {
    .login-layout {
      flex-direction: column;
    }

    .login-layout__main {
      flex: none;
      max-width: 100%;
      min-width: 100%;
      min-height: auto;
      padding: 20px 0;
    }

    .login-layout__main-content {
      padding: 20px;
      max-width: 100%;
    }

    .login-layout__aside {
      flex: 1;
      min-height: 300px;
    }

    .login-layout__aside-content {
      padding: 30px 20px;
    }

    .login-layout__stats {
      gap: 32px;
    }
  }
</style>
