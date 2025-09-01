import { Euler, euler } from './euler'
import {
  createRotationXMatrix,
  createRotationYMatrix,
  createRotationZMatrix,
  createTranslationMatrix,
  multiplyMatrices,
} from './scene'
import { createDeepProxy, deepCopy } from './util'
import { Vector, vec } from './vector'

export type Object3DState<TCustomState> = TCustomState & {
  position: Vector
  rotation: Euler
  quality: number
  group?: {
    position: Vector
    rotation: Euler
  }
}

export type Object3D<TCustomState> = {
  state: Object3DState<TCustomState>
  recalculate: () => void
  render: (gl: WebGLRenderingContext, program: WebGLProgram, modelViewMatrix: Float32Array, wireframe?: boolean) => void
}

export type Object3DOptions<TCustomState> = {
  recalculate: (state: Object3DState<TCustomState>) => void
  render: (gl: WebGLRenderingContext, program: WebGLProgram, modelViewMatrix: Float32Array, wireframe?: boolean) => void
}

export const createObject3D = <TCustomState extends Object3DState<any>>(
  initialState: Partial<Object3DState<TCustomState>> & TCustomState,
  props: Object3DOptions<TCustomState>
): Object3D<TCustomState> => {
  // Internal state
  const state: Object3DState<TCustomState> = {
    position: vec(),
    rotation: euler(),
    quality: 1.0,
    groupPosition: undefined,
    groupRotation: undefined,
    ...initialState,
  }

  let needsRecalc = false
  // Create deep proxy to auto-queue recalculation on any state change
  const stateProxy = createDeepProxy(state, () => {
    needsRecalc = true
  })

  const api: Object3D<TCustomState> = {
    state: stateProxy,
    recalculate: () => {
      props.recalculate(stateProxy)
      needsRecalc = true
    },
    render: (gl, program, modelViewMatrix, wireframe) => {
      if (needsRecalc) {
        api.recalculate()
      }

      // Calculate final position and rotation
      let finalPos = deepCopy(stateProxy.position)
      let finalRot = deepCopy(stateProxy.rotation)

      // Apply group transformation if present
      if (stateProxy.group) {
        const { position: groupPos, rotation: groupRot } = stateProxy.group

        // Part 1: Calculate final world position
        // Object position is already relative to group center, so rotate it and add group position
        const localPos = {
          x: finalPos.x,
          y: finalPos.y,
          z: finalPos.z,
        }

        // Apply group rotation to local position (Z * Y * X order with correct signs)
        const cosX = Math.cos(groupRot.x)
        const sinX = Math.sin(groupRot.x)
        const cosY = Math.cos(groupRot.y)
        const sinY = Math.sin(groupRot.y)
        const cosZ = Math.cos(groupRot.z)
        const sinZ = Math.sin(groupRot.z)

        // Apply rotations in Z * Y * X order with correct signs for intuitive behavior
        let rotatedX = localPos.x * cosZ + localPos.y * sinZ
        let rotatedY = -localPos.x * sinZ + localPos.y * cosZ
        let rotatedZ = localPos.z

        let tempX = rotatedX * cosY - rotatedZ * sinY
        let tempY = rotatedY
        let tempZ = rotatedX * sinY + rotatedZ * cosY

        const finalLocalX = tempX
        const finalLocalY = tempY * cosX - tempZ * sinX
        const finalLocalZ = tempY * sinX + tempZ * cosX

        // Add back to group position to get final world position
        finalPos.x = groupPos.x + finalLocalX
        finalPos.y = groupPos.y + finalLocalY
        finalPos.z = groupPos.z + finalLocalZ

        // Part 2: Calculate final world rotation using matrix multiplication
        // Create rotation matrices for object and group
        const objRotX = createRotationXMatrix(finalRot.x)
        const objRotY = createRotationYMatrix(finalRot.y)
        const objRotZ = createRotationZMatrix(finalRot.z)
        const objRotation = multiplyMatrices(objRotZ, multiplyMatrices(objRotY, objRotX))

        const groupRotX = createRotationXMatrix(groupRot.x)
        const groupRotY = createRotationYMatrix(groupRot.y)
        const groupRotZ = createRotationZMatrix(groupRot.z)
        const groupRotation = multiplyMatrices(groupRotZ, multiplyMatrices(groupRotY, groupRotX))

        // Combine rotations: group * object (group affects object)
        const combinedRotation = multiplyMatrices(groupRotation, objRotation)

        // Extract Euler angles from combined rotation matrix
        // This is a simplified extraction - assumes Z * Y * X order
        const m11 = combinedRotation[0]
        const m12 = combinedRotation[1]
        const m13 = combinedRotation[2]
        const m21 = combinedRotation[4]
        const m22 = combinedRotation[5]
        const m23 = combinedRotation[6]
        const m31 = combinedRotation[8]
        const m32 = combinedRotation[9]
        const m33 = combinedRotation[10]

        // Extract Euler angles (Z * Y * X order)
        finalRot.y = Math.asin(-m31)
        if (Math.abs(m31) < 0.999999) {
          finalRot.x = Math.atan2(m32, m33)
          finalRot.z = Math.atan2(m21, m11)
        } else {
          finalRot.x = Math.atan2(-m23, m22)
          finalRot.z = 0
        }
      }

      // Create transformation matrices (only once)
      const translation = createTranslationMatrix(finalPos.x, finalPos.y, finalPos.z - 15) // -15 for camera distance
      const rotationX = createRotationXMatrix(finalRot.x)
      const rotationY = createRotationYMatrix(finalRot.y)
      const rotationZ = createRotationZMatrix(finalRot.z)

      // Combine rotations: Z * Y * X (standard order)
      const rotation = multiplyMatrices(rotationZ, multiplyMatrices(rotationY, rotationX))
      const finalTransform = multiplyMatrices(rotation, translation)

      // Call the object's render function with the calculated transform
      props.render(gl, program, finalTransform, wireframe)
    },
  }
  props.recalculate(stateProxy)

  return api
}
