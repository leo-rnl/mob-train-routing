import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { TrainAnimator, type AnimationParams, DEFAULT_ANIMATION_PARAMS } from './TrainAnimator'

export interface TrainSceneOptions {
  /** Path to the GLB scene file */
  modelPath: string
  /** Enable transparent background (default: true) */
  transparent?: boolean
  /** Enable antialiasing (default: true) */
  antialias?: boolean
}

/** Tweakable scene parameters */
export interface SceneParams {
  camera: {
    distance: number
    angle: number
    offsetX: number
    elevation: number
    fov: number
  }
  model: {
    scale: number
    rotationY: number
  }
  lighting: {
    ambient: number
    main: number
    fill: number
  }
  animation: AnimationParams
}

/** Default scene parameters */
const DEFAULT_PARAMS: SceneParams = {
  camera: {
    distance: 0.5,
    angle: Math.PI / 3,
    offsetX: -27,
    elevation: 0.3,
    fov: 30,
  },
  model: {
    scale: 1.5,
    rotationY: Math.PI,
  },
  lighting: {
    ambient: 1.5,
    main: 3.0,
    fill: 1.0,
  },
  animation: DEFAULT_ANIMATION_PARAMS,
}

/**
 * TrainScene - Manages a Three.js scene for displaying a train GLB model
 *
 * Usage:
 * ```ts
 * const scene = new TrainScene(canvas, { modelPath: '/models/train-scene.glb' })
 * await scene.load()
 * scene.start()
 * // On cleanup:
 * scene.dispose()
 * ```
 */
export class TrainScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private loader: GLTFLoader
  private animationId: number | null = null
  private model: THREE.Group | null = null
  private options: Required<TrainSceneOptions>
  private params: SceneParams
  private lights: {
    ambient: THREE.AmbientLight
    main: THREE.DirectionalLight
    fill: THREE.DirectionalLight
  } | null = null
  private animator: TrainAnimator | null = null
  private clock = new THREE.Clock()

  // Reference width for FOV scaling (prevents seeing rail edges on ultrawide)
  // Lower value = more aggressive zoom on wide screens
  private static readonly REFERENCE_WIDTH = 1600

  constructor(
    private canvas: HTMLCanvasElement,
    options: TrainSceneOptions
  ) {
    this.options = {
      transparent: true,
      antialias: true,
      ...options,
    }

    // Initialize params with defaults
    this.params = structuredClone(DEFAULT_PARAMS)

    // Scene setup
    this.scene = new THREE.Scene()

    // Camera setup - will be adjusted on resize
    this.camera = new THREE.PerspectiveCamera(this.params.camera.fov, 1, 0.1, 1000)
    this.camera.position.set(0, 2, 5)
    this.camera.lookAt(0, 0, 0)

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: this.options.transparent,
      antialias: this.options.antialias,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    // Loader setup with DRACO support (using files from public/libs/draco/)
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/libs/draco/')
    this.loader = new GLTFLoader()
    this.loader.setDRACOLoader(dracoLoader)

    // Setup lighting
    this.setupLights()

    // Initial resize
    this.resize()
  }

  /**
   * Setup scene lighting
   */
  private setupLights(): void {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, this.params.lighting.ambient)
    this.scene.add(ambientLight)

    // Main directional light (sun-like)
    const mainLight = new THREE.DirectionalLight(0xffffff, this.params.lighting.main)
    mainLight.position.set(5, 10, 7)
    mainLight.castShadow = false
    this.scene.add(mainLight)

    // Fill light from the opposite side
    const fillLight = new THREE.DirectionalLight(0xffffff, this.params.lighting.fill)
    fillLight.position.set(-5, 5, -5)
    this.scene.add(fillLight)

    // Store references for later updates
    this.lights = { ambient: ambientLight, main: mainLight, fill: fillLight }
  }

  /**
   * Load the GLB model
   */
  async load(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        this.options.modelPath,
        (gltf: GLTF) => {
          this.model = gltf.scene
          this.model.scale.setScalar(this.params.model.scale)
          this.model.rotation.y = this.params.model.rotationY
          this.scene.add(this.model)
          this.fitCameraToModel()

          // Initialize train animator
          this.animator = new TrainAnimator(this.model, this.camera, this.params.animation)

          resolve()
        },
        undefined, // Progress callback (unused)
        (error: unknown) => {
          console.error('Error loading GLB model:', error)
          reject(error)
        }
      )
    })
  }

  /**
   * Adjust camera to fit the loaded model with isometric-like view
   */
  private fitCameraToModel(): void {
    if (!this.model) return

    const box = new THREE.Box3().setFromObject(this.model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    // Calculate the distance needed to fit the model
    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = this.params.camera.fov * (Math.PI / 180)
    let cameraDistance = maxDim / (2 * Math.tan(fov / 2))

    // Apply distance multiplier from params
    cameraDistance *= this.params.camera.distance

    // Isometric-like camera position using params
    const angle = this.params.camera.angle
    const offsetX = this.params.camera.offsetX
    const elevation = this.params.camera.elevation

    this.camera.position.set(
      center.x + cameraDistance * Math.sin(angle) * 0.8 + offsetX,
      center.y + cameraDistance * elevation,
      center.z + cameraDistance * Math.cos(angle) * 0.9
    )
    this.camera.lookAt(center.x + offsetX, center.y, center.z)

    // Update camera FOV and projection
    this.camera.fov = this.params.camera.fov
    this.camera.near = cameraDistance / 100
    this.camera.far = cameraDistance * 100
    this.camera.updateProjectionMatrix()
  }

  /**
   * Handle canvas resize
   */
  resize(): void {
    const parent = this.canvas.parentElement
    if (!parent) return

    const width = parent.clientWidth
    const height = parent.clientHeight

    this.canvas.width = width
    this.canvas.height = height

    this.camera.aspect = width / height

    // Adjust FOV for wide viewports to prevent seeing rail edges
    if (width > TrainScene.REFERENCE_WIDTH) {
      const scaleFactor = TrainScene.REFERENCE_WIDTH / width
      this.camera.fov = this.params.camera.fov * scaleFactor
    } else {
      this.camera.fov = this.params.camera.fov
    }

    this.camera.updateProjectionMatrix()

    this.renderer.setSize(width, height)
  }

  /**
   * Render loop
   */
  private render = (): void => {
    this.animationId = requestAnimationFrame(this.render)

    // Update train animations
    const deltaTime = this.clock.getDelta() * 1000 // Convert to ms-like scale
    this.animator?.update(deltaTime)

    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Start the render loop
   */
  start(): void {
    if (this.animationId !== null) return
    this.render()
  }

  /**
   * Stop the render loop
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  /**
   * Get the Three.js scene (for future animation extensions)
   */
  getScene(): THREE.Scene {
    return this.scene
  }

  /**
   * Get the loaded model (for future animation extensions)
   */
  getModel(): THREE.Group | null {
    return this.model
  }

  /**
   * Get current scene parameters (for debug GUI)
   */
  getParams(): SceneParams {
    return this.params
  }

  /**
   * Update scene parameters and apply changes
   */
  updateParams(category: 'camera' | 'model' | 'lighting'): void {
    switch (category) {
      case 'camera':
        this.fitCameraToModel()
        break
      case 'model':
        if (this.model) {
          this.model.scale.setScalar(this.params.model.scale)
          this.model.rotation.y = this.params.model.rotationY
        }
        break
      case 'lighting':
        if (this.lights) {
          this.lights.ambient.intensity = this.params.lighting.ambient
          this.lights.main.intensity = this.params.lighting.main
          this.lights.fill.intensity = this.params.lighting.fill
        }
        break
    }
  }

  /**
   * Cleanup all resources
   */
  dispose(): void {
    this.stop()

    // Dispose animator
    this.animator?.dispose()

    // Dispose of geometries and materials
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose())
        } else {
          object.material.dispose()
        }
      }
    })

    this.renderer.dispose()
  }
}
