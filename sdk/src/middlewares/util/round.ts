import { GameState } from '../../types'
import { DeltaMiddleware } from '../types'

export const round = (value: number, precision: number) => {
  if (precision === 0) {
    return Math.round(value)
  }
  const factor = Math.pow(10, precision)
  return Math.round(value * factor) / factor
}

export const recursivelyRound = <T extends Record<string, any>>(
  delta: Partial<T>,
  keysToRound: readonly string[],
  precision: Record<keyof T, number>
) => {
  if (typeof delta !== 'object' || delta === null) {
    return
  }
  keysToRound.forEach((key) => {
    if (!(key in delta) || typeof delta[key] !== 'number') {
      return
    }
    const precisionValue = precision[key]
    if (precisionValue !== undefined) {
      ;(delta as any)[key] = round((delta as any)[key], precisionValue)
    }
  })
  Object.keys(delta).forEach((key) => {
    if (typeof delta[key] === 'object' && delta[key] !== null) {
      recursivelyRound(delta[key], keysToRound, precision)
    }
  })
}

export const createPrecisionMiddleware = <T extends GameState, K extends string>(
  keys: readonly K[],
  defaultPrecision: number,
  options?: Partial<{ precision: Record<K, number> }>
): DeltaMiddleware<T> => {
  const precision: Record<K, number> = keys.reduce(
    (acc, key) => {
      acc[key] = options?.precision?.[key] ?? defaultPrecision
      return acc
    },
    {} as Record<K, number>
  )

  return (baseState, delta, next) => {
    if (typeof delta === 'object' && delta !== null) {
      recursivelyRound(delta as Partial<T>, keys, precision as Record<keyof T, number>)
    }
    next(delta)
  }
}
