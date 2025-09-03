export const round = (n: number, precision = 0) =>
  precision === 0 ? Math.round(n) : Math.round(n * Math.pow(10, precision)) / Math.pow(10, precision)

export const normalizeRad = (n: number) => {
  const twoPi = Math.PI * 2
  n = n % twoPi
  if (n < 0) n += twoPi
  return n
}

export const normalizeDeg = (n: number) => {
  n = n % 360
  if (n < 0) n += 360
  return n
}
type NormalizeFn = (obj: any, key: string, value: any, parentKeys: string[]) => any

export const createKeyNormalizer = (normalizeFn: NormalizeFn) => {
  const walk = <T extends Record<string, any>>(target: T, parentKeys: string[] = []): T => {
    if (typeof target !== 'object' || target === null) return target
    for (const key in target) {
      if (!Object.prototype.hasOwnProperty.call(target, key)) continue
      const value = target[key]
      if (typeof value === 'object' && value !== null) {
        walk(value, [...parentKeys, key])
      } else {
        target[key] = normalizeFn(target, key, value, parentKeys) as any
      }
    }
    return target
  }
  return walk
}

export const createPositionNormalizer = <TState extends Record<string, any>>(precision = 0) =>
  createKeyNormalizer((obj, key, value) => (['x', 'y', 'z'].includes(key) ? round(value, precision) : value))

export const createVelocityNormalizer = <TState extends Record<string, any>>(precision = 2) =>
  createKeyNormalizer((obj, key, value) => (['vx', 'vy', 'vz'].includes(key) ? round(value, precision) : value))

export const createRotationNormalizer = <TState extends Record<string, any>>(precision = 2, useDegrees = false) =>
  createKeyNormalizer((obj, key, value) => {
    if (['rx', 'ry', 'rz'].includes(key)) {
      const round = (n: number) =>
        precision === 0 ? Math.round(n) : Math.round(n * Math.pow(10, precision)) / Math.pow(10, precision)
      return round(useDegrees ? normalizeDeg(value) : normalizeRad(value))
    }
    return value
  })
