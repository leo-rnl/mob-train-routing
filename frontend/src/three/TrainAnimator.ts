import * as THREE from 'three'

/** Configuration for a single train */
export interface TrainConfig {
  name: string
  direction: 1 | -1 // 1 = positive Y, -1 = negative Y
  speed: number
  startY: number // Starting Y position
  endY: number // Y position to respawn
}

/** Animation parameters exposed for debug GUI */
export interface AnimationParams {
  train1Speed: number
  train2Speed: number
  train1StartY: number
  train1EndY: number
  train2StartY: number
  train2EndY: number
  respawnDelay: number // ms
  paused: boolean
}

/** Default animation parameters */
export const DEFAULT_ANIMATION_PARAMS: AnimationParams = {
  train1Speed: 0.06,
  train2Speed: 0.03,
  train1StartY: -13200,
  train1EndY: 5000,
  train2StartY: 5000,
  train2EndY: -10700,
  respawnDelay: 5000,
  paused: false,
}

interface TrainState {
  object: THREE.Object3D
  config: TrainConfig
  waiting: boolean
  waitUntil: number
}

/**
 * Animates trains along the Y axis with simple boundary respawn
 */
export class TrainAnimator {
  private trains: Map<string, TrainState> = new Map()
  private params: AnimationParams

  constructor(
    model: THREE.Group,
    _camera: THREE.Camera, // Keep for API compatibility
    params?: AnimationParams
  ) {
    this.params = params ?? structuredClone(DEFAULT_ANIMATION_PARAMS)

    // Find and setup trains (names match Blender export)
    // Train_01: passenger train, goes positive Y direction
    this.setupTrain(model, 'Train_01', 1)

    // Train_02_fret: freight train, goes negative Y direction
    this.setupTrain(model, 'Train_02_fret', -1)
  }

  private setupTrain(model: THREE.Group, name: string, direction: 1 | -1): void {
    const object = model.getObjectByName(name)
    if (!object) {
      console.warn(`[TrainAnimator] Train "${name}" not found in model`)
      return
    }

    const isTrain1 = name === 'Train_01'
    const startY = isTrain1 ? this.params.train1StartY : this.params.train2StartY
    const endY = isTrain1 ? this.params.train1EndY : this.params.train2EndY

    // Set initial position
    object.position.y = startY

    this.trains.set(name, {
      object,
      config: { name, direction, speed: 0, startY, endY },
      waiting: false,
      waitUntil: 0,
    })
  }

  /**
   * Update animation state - call this in the render loop
   */
  update(deltaTime: number): void {
    if (this.params.paused) return

    const now = Date.now()

    for (const [name, train] of this.trains) {
      // Handle waiting state
      if (train.waiting) {
        if (now >= train.waitUntil) {
          train.waiting = false
          const startY = name === 'Train_01' ? this.params.train1StartY : this.params.train2StartY
          train.object.position.y = startY
        }
        continue
      }

      const speed = name === 'Train_01' ? this.params.train1Speed : this.params.train2Speed
      const endY = name === 'Train_01' ? this.params.train1EndY : this.params.train2EndY

      // Move train along Y axis
      train.object.position.y += speed * train.config.direction * deltaTime * 60

      // Check if past end boundary -> start waiting
      const pastEnd =
        train.config.direction === -1
          ? train.object.position.y <= endY
          : train.object.position.y >= endY

      if (pastEnd) {
        train.waiting = true
        // Add variance: reduce delay by 0 to 1.5 seconds randomly
        const variance = Math.random() * 1500
        train.waitUntil = now + this.params.respawnDelay - variance
      }
    }
  }

  /**
   * Get animation parameters (for debug GUI)
   */
  getParams(): AnimationParams {
    return this.params
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.trains.clear()
  }
}
