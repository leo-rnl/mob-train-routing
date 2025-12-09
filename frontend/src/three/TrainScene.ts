import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

export interface TrainSceneOptions {
  /** Path to the GLB scene file */
  modelPath: string
  /** Enable transparent background (default: true) */
  transparent?: boolean
  /** Enable antialiasing (default: true) */
  antialias?: boolean
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

  constructor(
    private canvas: HTMLCanvasElement,
    options: TrainSceneOptions
  ) {
    this.options = {
      transparent: true,
      antialias: true,
      ...options,
    }

    // Scene setup
    this.scene = new THREE.Scene()

    // Camera setup - will be adjusted on resize
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
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

    // Loader setup with DRACO support (using local decoder from three.js package)
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/node_modules/three/examples/jsm/libs/draco/gltf/')
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    // Main directional light (sun-like)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1)
    mainLight.position.set(5, 10, 7)
    mainLight.castShadow = false
    this.scene.add(mainLight)

    // Fill light from the opposite side
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4)
    fillLight.position.set(-5, 5, -5)
    this.scene.add(fillLight)
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
          this.model.scale.setScalar(1.5)
          this.model.rotation.y = Math.PI // 180 degrees
          this.scene.add(this.model)
          this.fitCameraToModel()
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
    const fov = this.camera.fov * (Math.PI / 180)
    let cameraDistance = maxDim / (2 * Math.tan(fov / 2))

    // Closer view - smaller multiplier = bigger model on screen
    cameraDistance *= 0.5

    // Isometric-like camera position: offset on X and Z for diagonal view
    // Steeper angle for rails to span across the view diagonally
    const angle = Math.PI / 3 // 60 degrees (more diagonal)
    const offsetX = -15.8 // Shift view to the left
    this.camera.position.set(
      center.x + cameraDistance * Math.sin(angle) * 0.8 + offsetX,
      center.y + cameraDistance * 0.3, // Slight elevation
      center.z + cameraDistance * Math.cos(angle) * 0.9
    )
    this.camera.lookAt(center.x + offsetX, center.y, center.z)

    // Update near/far planes
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
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(width, height)
  }

  /**
   * Render loop
   */
  private render = (): void => {
    this.animationId = requestAnimationFrame(this.render)
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
   * Cleanup all resources
   */
  dispose(): void {
    this.stop()

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
