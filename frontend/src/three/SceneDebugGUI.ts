import GUI from 'lil-gui'
import type { TrainScene } from './TrainScene'

/**
 * Debug GUI for tweaking TrainScene parameters in development
 * Activated only when import.meta.env.DEV && window.location.hash.includes('debug')
 */
export class SceneDebugGUI {
  private gui: GUI

  constructor(scene: TrainScene) {
    this.gui = new GUI({ title: '🚂 Train Scene Debug' })

    const params = scene.getParams()

    // Camera folder
    const cameraFolder = this.gui.addFolder('📷 Camera')
    cameraFolder
      .add(params.camera, 'distance', 0.1, 2, 0.05)
      .name('Distance')
      .onChange(() => scene.updateParams('camera'))
    cameraFolder
      .add(params.camera, 'angle', 0, Math.PI, 0.05)
      .name('Angle (rad)')
      .onChange(() => scene.updateParams('camera'))
    cameraFolder
      .add(params.camera, 'offsetX', -30, 10, 0.1)
      .name('Offset X')
      .onChange(() => scene.updateParams('camera'))
    cameraFolder
      .add(params.camera, 'elevation', 0, 1, 0.05)
      .name('Elevation')
      .onChange(() => scene.updateParams('camera'))
    cameraFolder
      .add(params.camera, 'fov', 20, 100, 1)
      .name('FOV')
      .onChange(() => scene.updateParams('camera'))
    cameraFolder.open()

    // Model folder
    const modelFolder = this.gui.addFolder('🚃 Model')
    modelFolder
      .add(params.model, 'scale', 0.5, 5, 0.1)
      .name('Scale')
      .onChange(() => scene.updateParams('model'))
    modelFolder
      .add(params.model, 'rotationY', 0, Math.PI * 2, 0.1)
      .name('Rotation Y (rad)')
      .onChange(() => scene.updateParams('model'))
    modelFolder.open()

    // Lighting folder
    const lightingFolder = this.gui.addFolder('💡 Lighting')
    lightingFolder
      .add(params.lighting, 'ambient', 0, 2, 0.1)
      .name('Ambient')
      .onChange(() => scene.updateParams('lighting'))
    lightingFolder
      .add(params.lighting, 'main', 0, 3, 0.1)
      .name('Main Light')
      .onChange(() => scene.updateParams('lighting'))
    lightingFolder
      .add(params.lighting, 'fill', 0, 2, 0.1)
      .name('Fill Light')
      .onChange(() => scene.updateParams('lighting'))
    lightingFolder.open()
  }

  /**
   * Cleanup GUI
   */
  dispose(): void {
    this.gui.destroy()
  }
}

/**
 * Check if debug mode is enabled
 */
export const isDebugMode = (): boolean =>
  import.meta.env.DEV && window.location.hash.includes('debug')
