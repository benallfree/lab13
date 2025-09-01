import { Box } from './box'
import { Object3D, Object3DState } from './object3d'
import type { SceneApi } from './scene'

export type CubeStateBase = {
  color: [number, number, number]
  size: number
}

export type CubeState = Object3DState<CubeStateBase>

// Cube factory function - creates a box with equal dimensions
export type CubeProps = {
  scene: SceneApi
}

export type CubeApi = {
  render: (gl: WebGLRenderingContext, program: WebGLProgram, modelViewMatrix: Float32Array, wireframe?: boolean) => void
} & Object3D<CubeStateBase>

export function Cube(initialState?: Partial<CubeState>, options?: Partial<CubeProps>): CubeApi {
  const { scene = window.scene } = options ?? {}
  const { gl } = scene

  if (!scene) {
    throw new Error('Scene is required')
  }

  // Create the underlying Box
  const box = Box(
    {
      width: initialState?.size,
      height: initialState?.size,
      length: initialState?.size,
      ...initialState,
    },
    options
  )

  // Create the API object
  const api: CubeApi = {
    render: function (
      gl: WebGLRenderingContext,
      program: WebGLProgram,
      modelViewMatrix: Float32Array,
      wireframe = false
    ) {
      box.render(gl, program, modelViewMatrix, wireframe)
    },
    ...(box as unknown as Object3D<CubeStateBase>),
  }

  return api
}
