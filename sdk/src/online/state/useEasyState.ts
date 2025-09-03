import {
  PartialDeep,
  PLAYER_ENTITY_COLLECTION_KEY,
  PlayerEntityCollectionKey,
  StateBase,
  StateDelta,
  StateOptions,
  useState,
} from '.'
import { onClientLeft } from '../core-events'
import { useMyId } from '../myId'
import { createMyStateCopier } from './copier'
import { mkdbg } from './debug'
import { createPositionNormalizer, createRotationNormalizer } from './normalize'

export type UseEasyStateOptions<TStateShape extends StateBase> = {
  positionPrecision?: number
  rotationPrecision?: number
  rotationUnits?: 'd' | 'r'
  onPlayerStateAvailable?: (id: string, state: TStateShape[PlayerEntityCollectionKey][string]) => void
} & StateOptions<TStateShape>

export const useEasyState = <TStateShape extends StateBase>(options?: Partial<UseEasyStateOptions<TStateShape>>) => {
  const { positionPrecision = 0, rotationPrecision = 2, rotationUnits = 'd', debug = false } = options || {}
  const { getMyId } = useMyId()

  const dbg = mkdbg(getMyId(), debug)

  const myStateCopier = createMyStateCopier(getMyId)

  const playerStatesReported = new Set<string>()

  const positionNormalizer = createPositionNormalizer(positionPrecision)
  const rotationNormalizer = createRotationNormalizer(rotationPrecision, rotationUnits === 'd')

  const addMissingPlayers = (state: PartialDeep<TStateShape> | StateDelta<TStateShape>) => {
    for (const id in state[PLAYER_ENTITY_COLLECTION_KEY]) {
      if (id === getMyId()) continue
      if (playerStatesReported.has(id)) continue
      playerStatesReported.add(id)
      dbg(`Adding missing player`, id)
      const player = state[PLAYER_ENTITY_COLLECTION_KEY][id] as TStateShape[PlayerEntityCollectionKey][string]
      options?.onPlayerStateAvailable?.(id, player)
    }
  }
  const stateManager = useState<TStateShape>({
    onBeforeSendDelta: (delta) => {
      return positionNormalizer(rotationNormalizer(delta))
    },
    onBeforeSendState: (state) => {
      return positionNormalizer(rotationNormalizer(state))
    },
    onStateReceived: (currentState, newState) => {
      return myStateCopier(currentState, newState)
    },
    onAfterStateUpdated: (state, delta) => {
      dbg(`onAfterStateUpdated`, JSON.stringify(state, null, 2), JSON.stringify(delta, null, 2))
      addMissingPlayers(state)
    },
    ...options,
  })
  onClientLeft((id) => {
    console.log(`onClientLeft`, id)
    stateManager.updatePlayerState(id, null)
  })

  return stateManager
}
