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
      :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
      variant="outlined"
      class="mb-4"
      autocomplete="current-password"
      @click:append-inner="showPassword = !showPassword"
    />

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
