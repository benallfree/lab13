import { createObject3D, Object3D, Object3DState } from './object3d'
import type { SceneApi } from './scene'
import { interleaveVertices } from './util'

export type TriangleStateBase = {
  color: [number, number, number]
  vertices: [[number, number, number], [number, number, number], [number, number, number]]
}

export type TriangleState = Object3DState<TriangleStateBase>

// Base triangle factory function
export type TriangleProps = {
  scene: SceneApi
}

export type Triangle = {
  render: (gl: WebGLRenderingContext, program: WebGLProgram, modelViewMatrix: Float32Array, wireframe?: boolean) => void
} & Object3D<TriangleStateBase>

export function createTriangle(initialState?: Partial<TriangleState>, options?: Partial<TriangleProps>): Triangle {
  const { scene = window.scene } = options ?? {}
  const { gl } = scene

  if (!scene) {
    throw new Error('Scene is required')
  }

  // Create initial buffer
  const buffer = gl.createBuffer()

  // Create the underlying Object3D
  const object3d = createObject3D<TriangleStateBase>(
    {
      color: [1, 1, 1],
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
      ],
      ...initialState,
    },
    {
      recalculate: (state) => {
        // For Triangle, we could recalculate if vertices or color change
        // But since vertices are fixed, we just update the buffer with current data
        const flatVertices = interleaveVertices(state.vertices, state.color)

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, flatVertices, gl.STATIC_DRAW)
      },
      render: (gl, program, modelViewMatrix, wireframe) => {
        if (!buffer) return

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

        const positionLocation = gl.getAttribLocation(program, 'a_position')
        const colorLocation = gl.getAttribLocation(program, 'a_color')

        gl.enableVertexAttribArray(positionLocation)
        gl.enableVertexAttribArray(colorLocation)
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 24, 0)
        gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 24, 12)

        const modelViewMatrixLocation = gl.getUniformLocation(program, 'u_modelViewMatrix')
        gl.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix)

        gl.drawArrays(wireframe ? gl.LINE_LOOP : gl.TRIANGLES, 0, 3)
      },
    }
  )

  return object3d
}
