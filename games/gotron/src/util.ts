// Deep copy utility for js13k
export const deepCopy = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))

// Interleave vertices and colors into a Float32Array
export const interleaveVertices = (vertices: number[][], color: [number, number, number]): Float32Array => {
  const result = new Float32Array(vertices.length * 6) // 3 pos + 3 color per vertex
  for (let i = 0; i < vertices.length; i++) {
    const offset = i * 6
    result[offset + 0] = vertices[i][0] // x
    result[offset + 1] = vertices[i][1] // y
    result[offset + 2] = vertices[i][2] // z
    result[offset + 3] = color[0] // r
    result[offset + 4] = color[1] // g
    result[offset + 5] = color[2] // b
  }
  return result
}

// Deep proxy that recursively wraps objects and calls onChange on any property change
export const createDeepProxy = <T extends object>(obj: T, onChange: () => void): T => {
  return new Proxy(obj, {
    get(target: any, prop) {
      const value = target[prop]
      // If the value is an object, wrap it in a proxy too
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return createDeepProxy(value, onChange)
      }
      return value
    },
    set(target: any, prop: string | symbol, value: any) {
      target[prop] = value
      onChange()
      return true
    },
  })
}
