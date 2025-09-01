import { createObject3D, Object3D, Object3DState } from './object3d'
import type { SceneApi } from './scene'
import { Triangle } from './triangle'
import { deepCopy } from './util'

// Group factory function - combines multiple primitives into a single object
export type GeometryPrimitive = Triangle

export type GroupChild = GeometryPrimitive

export type GroupStateBase = {
  children: GroupChild[]
}

export type GroupState = Object3DState<GroupStateBase>

export type GroupProps = {
  scene: SceneApi
}

export type Group = {
  render: (gl: WebGLRenderingContext, program: WebGLProgram, modelViewMatrix: Float32Array, wireframe?: boolean) => void
  add: (child: GroupChild) => void
  remove: (child: GroupChild) => void
  getChildren: () => GroupChild[]
} & Object3D<GroupStateBase>

export function createGroup(initialState?: Partial<GroupState>, options?: Partial<GroupProps>): Group {
  const { scene = window.scene } = options ?? {}

  if (!scene) {
    throw new Error('Scene is required')
  }

  // Create the underlying Object3D
  const object3d = createObject3D<GroupStateBase>(
    {
      children: [],
      ...initialState,
    },
    {
      recalculate: (state) => {
        // Set group properties on all children
        for (const child of state.children) {
          child.state.group = {
            position: deepCopy(state.position),
            rotation: deepCopy(state.rotation),
          }
        }
      },
      render: (gl, program, modelViewMatrix, wireframe) => {
        // Render all children (they already have group properties set)
        for (const child of object3d.state.children) {
          child.render(gl, program, modelViewMatrix, wireframe)
        }
      },
    }
  )

  // Add group-specific methods
  const group: Group = {
    ...object3d,
    add: function (child: GroupChild) {
      object3d.state.children.push(child)
      object3d.recalculate()
    },
    remove: function (child: GroupChild) {
      const index = object3d.state.children.indexOf(child)
      if (index > -1) {
        object3d.state.children.splice(index, 1)
        object3d.recalculate()
      }
    },
    getChildren: function () {
      return [...object3d.state.children]
    },
  }

  return group
}
