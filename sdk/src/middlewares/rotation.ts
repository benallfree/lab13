import { GameState } from '../types'
import { DeltaMiddleware } from './types'
import { createPrecisionMiddleware } from './util/round'

export type RotationOptions = {
  precision: {
    rx: number
    ry: number
    rz: number
  }
}

const KEYS_TO_ROUND = ['rx', 'ry', 'rz'] as const
const DEFAULT_PRECISION = 2

export const rotation = <T extends GameState>(options?: Partial<RotationOptions>): DeltaMiddleware<T> => {
  return createPrecisionMiddleware<T, (typeof KEYS_TO_ROUND)[number]>(KEYS_TO_ROUND, DEFAULT_PRECISION, options)
}
