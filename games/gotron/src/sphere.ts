import { Ellipsoid } from './ellipsoid'
import { Euler, euler } from './euler'
import type { SceneApi } from './scene'
import { Vector, vec } from './vector'

// Sphere factory function - creates a sphere with equal radius in all directions
export type SphereOptions = {
  scene: SceneApi
  color: [number, number, number]
  radius: number
  maxTriangles?: number
  quality?: number
  position?: Vector
  rotation?: Euler
}

export type Sphere = ReturnType<typeof Sphere>
export function Sphere(options?: Partial<SphereOptions>) {
  const {
    scene = window.scene,
    color = [1, 1, 1],
    radius = 1,
    maxTriangles,
    quality,
    position = vec(),
    rotation = euler(),
  } = options ?? {}

  // A sphere is a special case of an ellipsoid where all radii are equal
  const ellipsoid = Ellipsoid({
    scene,
    color,
    radiusX: radius,
    radiusY: radius,
    radiusZ: radius,
    maxTriangles,
    quality,
    position,
    rotation,
  })

  // Return the ellipsoid with all its methods (it already has position/rotation methods)
  return ellipsoid
}
