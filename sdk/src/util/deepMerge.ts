// Deep merge utility function
export function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  if (!source) return target || {}
  const result = { ...target }
  for (const [key, value] of Object.entries(source)) {
    if (value === null) {
      delete result[key]
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = deepMerge(result[key] || {}, value)
    } else {
      result[key] = value
    }
  }
  return result
}
