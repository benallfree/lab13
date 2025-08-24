import { GameState, PartialDeep } from '../types'
import { DeltaMiddleware } from './types'

export type TombstoneOptions = {}

export const tombstone = <T extends GameState>(options?: Partial<TombstoneOptions>): DeltaMiddleware<T> => {
  const tombstoneEntities = new Set<string>()

  const filterTombstones = (delta: PartialDeep<T>, parentKey?: string) => {
    if (!parentKey?.startsWith('_')) {
      return delta
    }
    Object.keys(delta).forEach((key) => {
      const isTombstoned = tombstoneEntities.has(key)
      if (isTombstoned) {
        delete delta[key]
        return
      }
      const shouldTombstone = delta[key] === null
      if (shouldTombstone) {
        tombstoneEntities.add(key)
      }
      if (typeof delta[key] === 'object' && delta[key] !== null) {
        filterTombstones(delta[key], key)
      }
      return
    })
    return delta
  }

  return (baseState, delta, next) => {
    filterTombstones(delta)
    next(delta)
  }
}
