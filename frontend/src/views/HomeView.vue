<script setup lang="ts">
  import { ref } from 'vue'
  import RouteForm from '@/components/RouteForm.vue'
  import RouteResult from '@/components/RouteResult.vue'
  import type { Route, Station } from '@/types/api'

  const lastRoute = ref<Route | null>(null)
  const stationsMap = ref<Map<string, Station>>(new Map())

  function handleRouteCalculated(route: Route, stations: Map<string, Station>) {
    lastRoute.value = route
    // Merge stations into our map
    stations.forEach((station, key) => {
      stationsMap.value.set(key, station)
    })
  }
</script>

<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <RouteForm @route-calculated="handleRouteCalculated" />

        <RouteResult v-if="lastRoute" :route="lastRoute" :stations-map="stationsMap" />
      </v-col>
    </v-row>
  </v-container>
</template>
