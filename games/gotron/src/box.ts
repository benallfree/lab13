import { euler } from './euler'
import { createObject3D, Object3D, Object3DState } from './object3d'
import { Plane, PlaneApi } from './plane'
import type { SceneApi } from './scene'
import { vec } from './vector'

export type BoxStateBase = {
  color: [number, number, number]
  length: number
  width: number
  height: number
}

export type BoxState = Object3DState<BoxStateBase>

// Box factory function - creates 6 planes (6 faces)
export type BoxProps = {
  scene: SceneApi
}

export type BoxApi = {
  render: (gl: WebGLRenderingContext, program: WebGLProgram, modelViewMatrix: Float32Array, wireframe?: boolean) => void
} & Object3D<BoxStateBase>

export function Box(initialState?: Partial<BoxState>, options?: Partial<BoxProps>): BoxApi {
  const { scene = window.scene } = options ?? {}
  const { gl } = scene

  if (!scene) {
    throw new Error('Scene is required')
  }

  // Create planes (will be updated in recalculatePlanes)
  let frontPlane: PlaneApi
  let backPlane: PlaneApi
  let leftPlane: PlaneApi
  let rightPlane: PlaneApi
  let topPlane: PlaneApi
  let bottomPlane: PlaneApi

  // Create the underlying Object3D
  const object3d = createObject3D<BoxStateBase>(
    {
      color: [1, 1, 1],
      length: 1,
      width: 1,
      height: 1,
      ...initialState,
    },
    {
      recalculate: (state) => {
        const halfLength = state.length / 2
        const halfWidth = state.width / 2
        const halfHeight = state.height / 2

        const {
          position: { x, y, z },
          color,
          length,
          width,
          height,
        } = state

        // Front face (facing +Z)
        frontPlane = Plane({
          color,
          width: length,
          height: height,
          position: vec(x, y, z + halfWidth),
          rotation: euler(0, 0, 0),
        })

        // Back face (facing -Z)
        backPlane = Plane({
          color,
          width: length,
          height: height,
          position: vec(x, y, z - halfWidth),
          rotation: euler(0, Math.PI, 0),
        })

        // Left face (facing -X)
        leftPlane = Plane({
          color,
          width: width,
          height: height,
          position: vec(x - halfLength, y, z),
          rotation: euler(0, Math.PI / 2, 0),
        })

        // Right face (facing +X)
        rightPlane = Plane({
          color,
          width: width,
          height: height,
          position: vec(x + halfLength, y, z),
          rotation: euler(0, -Math.PI / 2, 0),
        })

        // Top face (facing +Y)
        topPlane = Plane({
          color,
          width: length,
          height: width,
          position: vec(x, y + halfHeight, z),
          rotation: euler(-Math.PI / 2, 0, 0),
        })

        // Bottom face (facing -Y)
        bottomPlane = Plane({
          color,
          width: length,
          height: width,
          position: vec(x, y - halfHeight, z),
          rotation: euler(Math.PI / 2, 0, 0),
        })
      },
      render: (gl, program, modelViewMatrix, wireframe) => {
        frontPlane.render(gl, program, modelViewMatrix, wireframe)
        backPlane.render(gl, program, modelViewMatrix, wireframe)
        leftPlane.render(gl, program, modelViewMatrix, wireframe)
        rightPlane.render(gl, program, modelViewMatrix, wireframe)
        topPlane.render(gl, program, modelViewMatrix, wireframe)
        bottomPlane.render(gl, program, modelViewMatrix, wireframe)
      },
    }
  )

  return object3d
}
