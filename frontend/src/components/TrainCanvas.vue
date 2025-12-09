<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue'
  import { TrainScene } from '@/three/TrainScene'
  import { SceneDebugGUI, isDebugMode } from '@/three/SceneDebugGUI'

  interface Props {
    /** Path to the GLB model file */
    modelPath: string
  }

  const props = defineProps<Props>()

  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const isLoading = ref(true)
  const hasError = ref(false)

  let trainScene: TrainScene | null = null
  let resizeObserver: ResizeObserver | null = null
  let debugGUI: SceneDebugGUI | null = null

  onMounted(async () => {
    if (!canvasRef.value) return

    try {
      trainScene = new TrainScene(canvasRef.value, {
        modelPath: props.modelPath,
      })

      await trainScene.load()
      trainScene.start()
      isLoading.value = false

      // Setup resize observer for responsive canvas
      resizeObserver = new ResizeObserver(() => {
        trainScene?.resize()
      })
      resizeObserver.observe(canvasRef.value.parentElement!)

      // Initialize debug GUI if in debug mode
      if (isDebugMode()) {
        debugGUI = new SceneDebugGUI(trainScene)
      }
    } catch (error) {
      console.error('Failed to initialize train scene:', error)
      hasError.value = true
      isLoading.value = false
    }
  })

  onBeforeUnmount(() => {
    debugGUI?.dispose()
    resizeObserver?.disconnect()
    trainScene?.dispose()
  })
</script>

<template>
  <div class="train-canvas-container">
    <canvas ref="canvasRef" class="train-canvas" />
    <div v-if="isLoading" class="train-canvas-loader">
      <v-progress-circular indeterminate color="white" size="48" />
    </div>
    <div v-if="hasError" class="train-canvas-fallback">
      <v-icon size="80" color="white" class="mb-4">mdi-train</v-icon>
    </div>
  </div>
</template>

<style scoped>
  .train-canvas-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .train-canvas {
    display: block;
    width: 100%;
    height: 100%;
  }

  .train-canvas-loader,
  .train-canvas-fallback {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .train-canvas-fallback {
    flex-direction: column;
  }
</style>
