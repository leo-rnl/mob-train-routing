<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()

  const email = ref('')
  const password = ref('')
  const showPassword = ref(false)

  const emailRules = [
    (v: string) => !!v || 'Email requis',
    (v: string) => /.+@.+\..+/.test(v) || 'Email invalide',
  ]

  const passwordRules = [(v: string) => !!v || 'Mot de passe requis']

  const isFormValid = computed(() => {
    return email.value && password.value && /.+@.+\..+/.test(email.value)
  })

  async function handleSubmit() {
    if (!isFormValid.value) return

    const success = await authStore.login(email.value, password.value)

    if (success) {
      const redirect = (route.query.redirect as string) || '/'
      router.push(redirect)
    }
  }
</script>

<template>
  <v-form @submit.prevent="handleSubmit">
    <v-alert
      v-if="authStore.error"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      role="alert"
      aria-live="polite"
      @click:close="authStore.clearError()"
    >
      {{ authStore.error }}
    </v-alert>

    <v-text-field
      v-model="email"
      label="Email"
      type="email"
      :rules="emailRules"
      prepend-inner-icon="mdi-email"
      variant="outlined"
      class="mb-2"
      autocomplete="email"
    />

    <v-text-field
      v-model="password"
      label="Mot de passe"
      :type="showPassword ? 'text' : 'password'"
      :rules="passwordRules"
      prepend-inner-icon="mdi-lock"
      variant="outlined"
      class="mb-4"
      autocomplete="current-password"
    >
      <template #append-inner>
        <v-icon
          :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
          role="button"
          tabindex="0"
          @click="showPassword = !showPassword"
          @keydown.enter="showPassword = !showPassword"
          @keydown.space.prevent="showPassword = !showPassword"
        >
          {{ showPassword ? 'mdi-eye-off' : 'mdi-eye' }}
        </v-icon>
      </template>
    </v-text-field>

    <v-btn
      type="submit"
      color="primary"
      block
      size="large"
      :loading="authStore.isLoading"
      :disabled="!isFormValid || authStore.isLoading"
    >
      Se connecter
    </v-btn>
  </v-form>
</template>
