<script setup lang="ts">
  import LoginForm from '@/components/LoginForm.vue'
  import TrainCanvas from '@/components/TrainCanvas.vue'
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

    <!-- Right panel: 3D Scene -->
    <aside class="login-layout__aside">
      <TrainCanvas model-path="/models/train-scene.glb" class="login-layout__canvas" />
      <!-- Top left: Title + tagline -->
      <div class="login-layout__header">
        <div class="login-layout__title-box">
          <span class="login-layout__title-mob">MOB</span>
          <span class="login-layout__title-main">Train Routing</span>
        </div>
        <p class="login-layout__tagline">
          Des Alpes au Léman,<br />
          optimisez vos trajets ferroviaires<br />
          sur le réseau Montreux-Oberland Bernois.
        </p>
      </div>

      <!-- Bottom right: Stats -->
      <div class="login-layout__footer">
        <div class="login-layout__stats">
          <div class="login-layout__stat">
            <span class="login-layout__stat-value">86</span>
            <span class="login-layout__stat-label">stations</span>
          </div>
          <div class="login-layout__stat">
            <span class="login-layout__stat-value">2</span>
            <span class="login-layout__stat-label">lignes</span>
          </div>
          <div class="login-layout__stat">
            <span class="login-layout__stat-value">63</span>
            <span class="login-layout__stat-label">km de voies</span>
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

  /* Right panel - 3D Scene */
  .login-layout__aside {
    flex: 1;
    position: relative;
    background-color: #e8e8e8;
    color: #0c0d19;
    overflow: hidden;
  }

  .login-layout__canvas {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  /* Top left: Title + tagline */
  .login-layout__header {
    position: absolute;
    top: 40px;
    left: 40px;
    z-index: 1;
  }

  .login-layout__title-box {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 20px 32px;
    border: 2px solid #0c0d19;
    background-color: rgba(255, 255, 255, 0.9);
    margin-bottom: 24px;
  }

  .login-layout__title-mob {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.4em;
    text-transform: uppercase;
    color: #0c0d19;
    opacity: 0.7;
    margin-bottom: 4px;
  }

  .login-layout__title-main {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgb(var(--v-theme-primary));
  }

  .login-layout__tagline {
    font-size: 1.1rem;
    line-height: 1.8;
    color: #0c0d19;
    max-width: 420px;
    opacity: 0.85;
  }

  /* Bottom right: Stats */
  .login-layout__footer {
    position: absolute;
    bottom: 40px;
    right: 40px;
    z-index: 1;
  }

  .login-layout__stats {
    display: inline-flex;
    gap: 24px;
    padding: 16px 24px;
    border: 2px solid #0c0d19;
    background-color: rgba(255, 255, 255, 0.9);
  }

  .login-layout__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .login-layout__stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: rgb(var(--v-theme-primary));
  }

  .login-layout__stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #0c0d19;
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
