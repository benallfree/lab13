// Helper function to deep clone objects via JSON serialization

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// Simple recursive merge function.
// When shouldDeleteOnNull is true, null means delete (same as server behavior).
// When false, nulls are preserved so they can be sent over the wire in deltas.

export function mergeState(target: any, source: any, shouldDeleteOnNull: boolean = true): any {
  if (source === null) {
    return null
  }

  if (typeof source !== 'object') {
    return source
  }

  if (typeof target !== 'object' || target === null) {
    target = {}
  }

  for (const key of Object.keys(source)) {
    if (source[key] === null) {
      if (shouldDeleteOnNull) {
        delete target[key]
      } else {
        target[key] = null
      }
    } else {
      target[key] = mergeState(target[key], source[key], shouldDeleteOnNull)
    }
  }

  return target
}

// Deep equality check for primitives, arrays, and plain objects
export function deepEqual(a: any, b: any): boolean {
  if (a === b) {
    // Handles most primitives (except NaN) and reference equality
    // Note: -0 === 0 is true and acceptable here for state comparisons
    return true
  }
  if (Number.isNaN(a) && Number.isNaN(b)) return true
  if (typeof a !== typeof b) return false

  if (a && b && typeof a === 'object') {
    const aIsArray = Array.isArray(a)
    const bIsArray = Array.isArray(b)
    if (aIsArray || bIsArray) {
      if (!aIsArray || !bIsArray) return false
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false
      }
      return true
    }

    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    if (aKeys.length !== bKeys.length) return false
    for (const key of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false
      if (!deepEqual(a[key], b[key])) return false
    }
    return true
  }

  return false
}

// Filter a delta against a base so only actual changes remain
export function filterDeltaAgainstBase(delta: any, base: any): any {
  if (delta === null) {
    // Deletion of a non-existent key is a no-op
    return base === undefined ? undefined : null
  }

  if (typeof delta !== 'object' || delta === null) {
    return deepEqual(delta, base) ? undefined : delta
  }

  if (Array.isArray(delta)) {
    return deepEqual(delta, base) ? undefined : delta
  }

  // Plain object: recurse
  const result: any = {}
  let hasAny = false
  for (const key of Object.keys(delta)) {
    const filteredChild = filterDeltaAgainstBase(delta[key], base ? base[key] : undefined)
    if (filteredChild !== undefined) {
      result[key] = filteredChild
      hasAny = true
    }
  }
  return hasAny ? result : undefined
}

// Helper function to generate UUIDs for game objects
export function generateUUID(): string {
  return (([1e7] as any) + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: number) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  )
}
