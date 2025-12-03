<script setup lang="ts">
  import LoginForm from '@/components/LoginForm.vue'
</script>

<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card class="pa-6" elevation="2">
          <v-card-title class="text-h5 text-center mb-4"> Connexion </v-card-title>

          <v-card-text>
            <LoginForm />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
