import { createObject3D, Object3D, Object3DState } from './object3d'
import type { SceneApi } from './scene'
import { createTriangle, Triangle } from './triangle'

export type PlaneStateBase = {
  color: [number, number, number]
  width: number
  height: number
}

export type PlaneState = Object3DState<PlaneStateBase>

// Plane factory function - creates 2 triangles
export type PlaneProps = {
  scene: SceneApi
}

export type PlaneApi = {
  render: (gl: WebGLRenderingContext, program: WebGLProgram, modelViewMatrix: Float32Array, wireframe?: boolean) => void
} & Object3D<PlaneStateBase>

export function Plane(initialState?: Partial<PlaneState>, options?: Partial<PlaneProps>): PlaneApi {
  const { scene = window.scene } = options ?? {}
  const { gl } = scene

  if (!scene) {
    throw new Error('Scene is required')
  }

  // Create triangles (will be updated in recalculateTriangles)
  let triangle1: Triangle
  let triangle2: Triangle

  // Create the underlying Object3D
  const object3d = createObject3D<PlaneStateBase>(
    {
      color: [1, 1, 1],
      width: 1,
      height: 1,
      ...initialState,
    },
    {
      recalculate: (state) => {
        const halfWidth = state.width / 2
        const halfHeight = state.height / 2

        const {
          position: { x, y, z },
        } = state
        // Create two triangles to form a rectangle (positioned correctly)
        triangle1 = createTriangle({
          color: state.color,
          vertices: [
            [x - halfWidth, y, z - halfHeight], // Bottom-left
            [x + halfWidth, y, z - halfHeight], // Bottom-right
            [x + halfWidth, y, z + halfHeight], // Top-right
          ],
        })

        triangle2 = createTriangle({
          color: state.color,
          vertices: [
            [x - halfWidth, y, z - halfHeight], // Bottom-left
            [x + halfWidth, y, z + halfHeight], // Top-right
            [x - halfWidth, y, z + halfHeight], // Top-left
          ],
        })
      },
      render: (gl, program, modelViewMatrix, wireframe) => {
        triangle1.render(gl, program, modelViewMatrix, wireframe)
        triangle2.render(gl, program, modelViewMatrix, wireframe)
      },
    }
  )

  return object3d
}
