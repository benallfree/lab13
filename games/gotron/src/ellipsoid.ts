import { Euler, euler } from './euler'
import type { SceneApi } from './scene'
import { createTriangle } from './triangle'
import { Vector, vec } from './vector'

// Ellipsoid factory function - creates triangles to approximate a 3D oval
export type EllipsoidOptions = {
  scene: SceneApi
  color: [number, number, number]
  radiusX: number
  radiusY: number
  radiusZ: number
  maxTriangles?: number
  quality?: number
  position?: Vector
  rotation?: Euler
}

export type Ellipsoid = ReturnType<typeof Ellipsoid>
export function Ellipsoid(options?: Partial<EllipsoidOptions>) {
  const {
    scene = window.scene,
    color = [1, 1, 1],
    radiusX = 1,
    radiusY = 1,
    radiusZ = 1,
    maxTriangles,
    quality = 0.7,
    position = vec(),
    rotation = euler(),
  } = options ?? {}

  // Internal state that can be mutated
  let currentPosition = { ...position }
  let currentRotation = { ...rotation }
  let currentQuality = quality
  let currentMaxTriangles = maxTriangles
  let triangles: Triangle[] = []

  function calculateTriangles() {
    // Calculate maxTriangles based on quality and size if not specified
    let finalMaxTriangles = currentMaxTriangles
    if (!finalMaxTriangles) {
      // Base triangle count on the largest radius and quality
      const maxRadius = Math.max(radiusX, radiusY, radiusZ)
      const baseTriangles = Math.pow(maxRadius * 20, 2) // Base formula: (radius * 20)^2
      finalMaxTriangles = Math.floor(baseTriangles * currentQuality)

      // Clamp to reasonable bounds
      finalMaxTriangles = Math.max(64, Math.min(2048, finalMaxTriangles))
    }

    // Calculate segments based on maxTriangles
    // Each quad (2 triangles) needs 4 vertices, so we can estimate segments
    const segments = Math.max(8, Math.min(32, Math.floor(Math.sqrt(finalMaxTriangles / 2))))

    // Clear existing triangles
    triangles = []

    // Generate vertices for the ellipsoid
    const vertices: [number, number, number][] = []

    // Create vertices for the ellipsoid surface
    for (let lat = 0; lat <= segments; lat++) {
      const theta = (lat * Math.PI) / segments
      const sinTheta = Math.sin(theta)
      const cosTheta = Math.cos(theta)

      for (let lon = 0; lon <= segments; lon++) {
        const phi = (lon * 2 * Math.PI) / segments
        const sinPhi = Math.sin(phi)
        const cosPhi = Math.cos(phi)

        // Parametric equations for ellipsoid
        const vertexX = currentPosition.x + radiusX * sinTheta * cosPhi
        const vertexY = currentPosition.y + radiusY * sinTheta * sinPhi
        const vertexZ = currentPosition.z + radiusZ * cosTheta

        vertices.push([vertexX, vertexY, vertexZ])
      }
    }

    // Create triangles from the vertices
    for (let lat = 0; lat < segments; lat++) {
      for (let lon = 0; lon < segments; lon++) {
        const current = lat * (segments + 1) + lon
        const next = current + segments + 1

        // Create two triangles for each quad
        if (lat > 0) {
          // First triangle
          triangles.push(
            createTriangle({
              scene,
              color,
              vertices: [vertices[current], vertices[next], vertices[current + 1]],
            })
          )
        }

        if (lat < segments - 1) {
          // Second triangle
          triangles.push(
            createTriangle({
              scene,
              color,
              vertices: [vertices[next], vertices[next + 1], vertices[current + 1]],
            })
          )
        }
      }
    }
  }

  // Initial triangle calculation
  calculateTriangles()

  return {
    render: function (
      gl: WebGLRenderingContext,
      program: WebGLProgram,
      modelViewMatrix: Float32Array,
      wireframe = false
    ) {
      for (const triangle of triangles) {
        triangle.render(gl, program, modelViewMatrix, wireframe)
      }
    },
    quality: function (newQuality?: number) {
      if (newQuality !== undefined) {
        currentQuality = Math.max(0.0, Math.min(1.0, newQuality))
        calculateTriangles()
      }
      return currentQuality
    },
    get position() {
      return currentPosition
    },
    set position(value: Vector) {
      currentPosition = { ...value }
    },
    get rotation() {
      return currentRotation
    },
    set rotation(value: Euler) {
      currentRotation = { ...value }
    },
  }
}
