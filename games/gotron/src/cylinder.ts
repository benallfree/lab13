import { Euler, euler } from './euler'
import type { SceneApi } from './scene'
import { createTriangle } from './triangle'
import { Vector, vec } from './vector'

// Cylinder factory function - creates a cylinder or truncated cone
export type CylinderOptions = {
  scene: SceneApi
  color: [number, number, number]
  diameterTop: number
  diameterBottom: number
  height: number
  maxTriangles?: number
  quality?: number
  position?: Vector
  rotation?: Euler
}

export type Cylinder = ReturnType<typeof Cylinder>
export function Cylinder(options?: Partial<CylinderOptions>) {
  const {
    scene = window.scene,
    color = [1, 1, 1],
    diameterTop = 1,
    diameterBottom = 1,
    height = 1,
    maxTriangles,
    quality = 0.7,
    position = vec(),
    rotation = euler(),
  } = options ?? {}

  let currentQuality = quality
  let currentMaxTriangles = maxTriangles
  let triangles: Triangle[] = []

  function calculateTriangles() {
    // Calculate maxTriangles based on quality and size if not specified
    let finalMaxTriangles = currentMaxTriangles
    if (!finalMaxTriangles) {
      // Base triangle count on the height and average diameter
      const avgDiameter = (diameterTop + diameterBottom) / 2
      const baseTriangles = Math.pow(avgDiameter * 15 + height * 10, 2) // Base formula
      finalMaxTriangles = Math.floor(baseTriangles * currentQuality)

      // Clamp to reasonable bounds
      finalMaxTriangles = Math.max(64, Math.min(2048, finalMaxTriangles))
    }

    // Calculate segments based on maxTriangles
    // We need segments for both the side faces and the end caps
    const segments = Math.max(8, Math.min(32, Math.floor(Math.sqrt(finalMaxTriangles / 4))))

    // Clear existing triangles
    triangles = []

    const radiusTop = diameterTop / 2
    const radiusBottom = diameterBottom / 2
    const halfHeight = height / 2

    // Generate vertices for the cylinder
    const vertices: [number, number, number][] = []

    // Top cap vertices
    for (let i = 0; i <= segments; i++) {
      const angle = (i * 2 * Math.PI) / segments
      const vertexX = currentPosition.x + radiusTop * Math.cos(angle)
      const vertexY = currentPosition.y + halfHeight
      const vertexZ = currentPosition.z + radiusTop * Math.sin(angle)
      vertices.push([vertexX, vertexY, vertexZ])
    }

    // Bottom cap vertices
    for (let i = 0; i <= segments; i++) {
      const angle = (i * 2 * Math.PI) / segments
      const vertexX = currentPosition.x + radiusBottom * Math.cos(angle)
      const vertexY = currentPosition.y - halfHeight
      const vertexZ = currentPosition.z + radiusBottom * Math.sin(angle)
      vertices.push([vertexX, vertexY, vertexZ])
    }

    // Top cap triangles (fan from center)
    const topCenterIndex = vertices.length
    vertices.push([currentPosition.x, currentPosition.y + halfHeight, currentPosition.z]) // Top center

    for (let i = 0; i < segments; i++) {
      const current = i
      const next = (i + 1) % segments

      triangles.push(
        createTriangle({
          scene,
          color,
          vertices: [vertices[topCenterIndex], vertices[current], vertices[next]],
        })
      )
    }

    // Bottom cap triangles (fan from center)
    const bottomCenterIndex = vertices.length
    vertices.push([currentPosition.x, currentPosition.y - halfHeight, currentPosition.z]) // Bottom center

    for (let i = 0; i < segments; i++) {
      const current = segments + 1 + i
      const next = segments + 1 + ((i + 1) % segments)

      triangles.push(
        createTriangle({
          scene,
          color,
          vertices: [vertices[bottomCenterIndex], vertices[next], vertices[current]],
        })
      )
    }

    // Side face triangles (quads made of 2 triangles each)
    for (let i = 0; i < segments; i++) {
      const currentTop = i
      const nextTop = (i + 1) % segments
      const currentBottom = segments + 1 + i
      const nextBottom = segments + 1 + ((i + 1) % segments)

      // First triangle of the quad
      triangles.push(
        createTriangle({
          scene,
          color,
          vertices: [vertices[currentTop], vertices[currentBottom], vertices[nextTop]],
        })
      )

      // Second triangle of the quad
      triangles.push(
        createTriangle({
          scene,
          color,
          vertices: [vertices[nextTop], vertices[currentBottom], vertices[nextBottom]],
        })
      )
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
    position: currentPosition,
    rotation: currentRotation,
  }
}
