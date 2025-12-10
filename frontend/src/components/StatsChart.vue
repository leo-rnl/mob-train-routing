<script setup lang="ts">
  import { computed } from 'vue'
  import { Bar, Line } from 'vue-chartjs'
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js'
  import type { DistanceStat, GroupBy } from '@/types/api'

  // Register Chart.js components
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
  )

  const props = defineProps<{
    data: DistanceStat[]
    groupBy: GroupBy
    loading?: boolean
  }>()

  // Modern color palette
  const CHART_COLORS = [
    '#5a7d9a',
    '#e07b53',
    '#6b8e5e',
    '#9b6b9e',
    '#c4a35a',
    '#4a90a4',
    '#d4726a',
    '#7c9885',
  ]

  // Determine chart type based on groupBy
  const chartComponent = computed(() => {
    if (props.groupBy === 'none') return Bar
    if (props.groupBy === 'year') return Bar
    return Line
  })

  const isHorizontal = computed(() => props.groupBy === 'none')

  // Transform data for Chart.js
  const chartData = computed(() => {
    if (!props.data.length) {
      return { labels: [], datasets: [] }
    }

    if (props.groupBy === 'none') {
      // Simple bar chart: one bar per analyticCode with distinct colors
      const colors = props.data.map((_, index) => CHART_COLORS[index % CHART_COLORS.length])
      return {
        labels: props.data.map((d) => d.analyticCode),
        datasets: [
          {
            label: 'Distance (km)',
            data: props.data.map((d) => d.totalDistanceKm),
            backgroundColor: colors,
            barThickness: 18,
          },
        ],
      }
    }

    // Grouped data: need to pivot by date/period
    const groups = [...new Set(props.data.map((d) => d.group))].sort()
    const codes = [...new Set(props.data.map((d) => d.analyticCode))]

    const datasets = codes.map((code, index) => {
      const dataPoints = groups.map((group) => {
        const item = props.data.find((d) => d.analyticCode === code && d.group === group)
        return item?.totalDistanceKm ?? 0
      })

      const color = CHART_COLORS[index % CHART_COLORS.length]

      if (props.groupBy === 'year') {
        return {
          label: code,
          data: dataPoints,
          backgroundColor: color,
          barThickness: 24,
        }
      }

      // Line chart for day/month
      return {
        label: code,
        data: dataPoints,
        borderColor: color,
        backgroundColor: color + '15',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      }
    })

    return {
      labels: groups,
      datasets,
    }
  })

  // Chart.js options
  const chartOptions = computed(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartData.value.datasets.length > 1,
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            padding: 16,
          },
        },
        tooltip: {
          callbacks: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label: (context: any) => {
              const value = isHorizontal.value ? context.parsed.x : context.parsed.y
              return `${context.dataset.label}: ${value?.toFixed(2)} km`
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: !isHorizontal.value,
            color: 'rgba(0, 0, 0, 0.06)',
          },
        },
        y: {
          grid: {
            color: 'rgba(0, 0, 0, 0.06)',
          },
          ticks: {
            callback: (value: string | number) => `${value} km`,
          },
        },
      },
    }

    if (isHorizontal.value) {
      return {
        ...baseOptions,
        indexAxis: 'y' as const,
        scales: {
          ...baseOptions.scales,
          x: {
            ...baseOptions.scales.x,
            grid: {
              color: 'rgba(0, 0, 0, 0.06)',
            },
            ticks: {
              callback: (value: string | number) => `${value} km`,
            },
          },
          y: {
            ...baseOptions.scales.y,
            grid: {
              display: false,
            },
            ticks: {},
          },
        },
      }
    }

    return baseOptions
  })

  const hasData = computed(() => props.data.length > 0)
</script>

<template>
  <v-card class="stats-chart-card mb-6">
    <v-card-text class="pa-4">
      <!-- Loading state -->
      <div
        v-if="loading"
        class="chart-container d-flex align-center justify-center"
        aria-label="Chargement des statistiques"
      >
        <v-progress-circular indeterminate color="primary" aria-hidden="true" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!hasData"
        class="chart-container d-flex flex-column align-center justify-center text-medium-emphasis"
      >
        <v-icon size="48" color="grey-lighten-1" class="mb-2" aria-hidden="true"
          >mdi-chart-bar</v-icon
        >
        <span class="text-body-2">Aucune donnée à afficher</span>
      </div>

      <!-- Chart -->
      <div
        v-else
        class="chart-container"
        role="img"
        aria-label="Graphique des distances par code analytique"
      >
        <component :is="chartComponent" :data="chartData" :options="chartOptions" />
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
  .stats-chart-card {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    transition: border-color 0.15s ease;
    border: 2px solid transparent;
  }

  .stats-chart-card:hover {
    border-color: #000;
  }

  .chart-container {
    height: 220px;
  }
</style>
