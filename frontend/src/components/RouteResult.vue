<script setup lang="ts">
  import type { Route, Station } from '@/types/api'

  const props = defineProps<{
    route: Route
    stationsMap: Map<string, Station>
  }>()

  function getStationName(shortName: string): string {
    return props.stationsMap.get(shortName)?.longName || shortName
  }
</script>

<template>
  <v-card variant="outlined" class="mt-4">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-map-marker-path</v-icon>
      Résultat du trajet
    </v-card-title>

    <v-card-text>
      <v-row>
        <v-col cols="12" sm="6">
          <div class="text-caption text-medium-emphasis">Départ</div>
          <div class="text-body-1 font-weight-medium">
            {{ getStationName(route.fromStationId) }}
          </div>
        </v-col>

        <v-col cols="12" sm="6">
          <div class="text-caption text-medium-emphasis">Arrivée</div>
          <div class="text-body-1 font-weight-medium">
            {{ getStationName(route.toStationId) }}
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-3" />

      <v-row>
        <v-col cols="6">
          <div class="text-caption text-medium-emphasis">Distance</div>
          <div class="text-h6 text-primary">{{ route.distanceKm.toFixed(2) }} km</div>
        </v-col>

        <v-col cols="6">
          <div class="text-caption text-medium-emphasis">Code analytique</div>
          <div class="text-body-1">{{ route.analyticCode }}</div>
        </v-col>
      </v-row>

      <v-divider class="my-3" />

      <div class="text-caption text-medium-emphasis mb-2">Itinéraire</div>
      <div class="d-flex flex-wrap ga-1">
        <template v-for="(station, index) in route.path" :key="station">
          <v-chip size="small" variant="tonal">
            {{ getStationName(station) }}
          </v-chip>
          <v-icon v-if="index < route.path.length - 1" size="small" class="mx-1 align-self-center">
            mdi-chevron-right
          </v-icon>
        </template>
      </div>
    </v-card-text>
  </v-card>
</template>
