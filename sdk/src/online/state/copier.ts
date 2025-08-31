import { StateBase } from '.'
import { PartialDeep, PLAYER_ENTITY_COLLECTION_KEY } from './merge'

export const createMyStateCopier =
  (myIdGetter: () => string | null) =>
  <TStateShape extends StateBase>(currentState: PartialDeep<TStateShape>, newState: PartialDeep<TStateShape>) => {
    const myId = myIdGetter()
    if (!myId) return newState
    return {
      ...newState,
      [PLAYER_ENTITY_COLLECTION_KEY]: {
        ...newState[PLAYER_ENTITY_COLLECTION_KEY],
        [myId]: currentState[PLAYER_ENTITY_COLLECTION_KEY]?.[myId] || {},
      },
    }
  }
