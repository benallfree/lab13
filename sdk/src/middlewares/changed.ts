import { GameState, PartialDeep } from '../types'
import { DeltaMiddleware } from './types'

export type ChangedOptions = {}

const deepEqual = (a: any, b: any): boolean => {
  if (a === b) {
    return true
  }

  if (a == null || b == null) {
    return a === b
  }

  if (typeof a !== typeof b) {
    return false
  }

  if (typeof a !== 'object') {
    return a === b
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    return false
  }

  if (Array.isArray(a)) {
    if (a.length !== b.length) {
      return false
    }
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) {
        return false
      }
    }
    return true
  }

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) {
    return false
  }

  for (const key of keysA) {
    if (!keysB.includes(key)) {
      return false
    }
    if (!deepEqual(a[key], b[key])) {
      return false
    }
  }

  return true
}

const filterUnchanged = <T extends GameState>(delta: PartialDeep<T>, baseState: T, parentKey?: string): void => {
  if (typeof delta !== 'object' || delta === null) {
    return
  }

  Object.keys(delta).forEach((key) => {
    const deltaValue = delta[key]
    const baseValue = baseState[key]

    if (deepEqual(deltaValue, baseValue)) {
      delete delta[key]
      return
    }

    if (typeof deltaValue === 'object' && deltaValue !== null && typeof baseValue === 'object' && baseValue !== null) {
      filterUnchanged(deltaValue, baseValue, key)

      // If the object is now empty after filtering, remove it
      if (Object.keys(deltaValue).length === 0) {
        delete delta[key]
      }
    }
  })
}

export const changed = <T extends GameState>(options?: Partial<ChangedOptions>): DeltaMiddleware<T> => {
  return (baseState, delta, next) => {
    if (typeof delta === 'object' && delta !== null) {
      filterUnchanged(delta, baseState)
    }
    next(delta)
  }
}
