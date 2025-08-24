import { GameState } from '../types'
import { DeltaMiddleware } from './types'
import { createPrecisionMiddleware } from './util/round'

export type PositionOptions = {
  precision: {
    x: number
    y: number
    z: number
  }
}

const KEYS_TO_ROUND = ['x', 'y', 'z'] as const
const DEFAULT_PRECISION = 0

export const position = <T extends GameState>(options?: Partial<PositionOptions>): DeltaMiddleware<T> => {
  return createPrecisionMiddleware<T, (typeof KEYS_TO_ROUND)[number]>(KEYS_TO_ROUND, DEFAULT_PRECISION, options)
}
