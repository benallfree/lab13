import { GameState, PartialDeep } from '../types'

export type NextMiddleware<T extends GameState> = (delta: PartialDeep<T>) => void

export type DeltaMiddleware<T extends GameState> = (
  baseState: T,
  delta: PartialDeep<T>,
  next: NextMiddleware<T>
) => void
