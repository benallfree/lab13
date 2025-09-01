import type { PartySocket } from 'partysocket'
import { labCommand, onCommandMessage, sendCommandMessageToAll, sendCommandMessageToClient } from '../command'
import { onClientJoined, onClientLeft } from '../core-events'
import { deepCopy } from '../deepCopy'
import { useMyId } from '../myId'
import { filterPrivateKeys } from './filterPrivateKeys'
import {
  mergeDeep,
  PartialDeep,
  PartialStructWithNullPropsDeep,
  PLAYER_ENTITY_COLLECTION_KEY,
  PlayerEntityCollectionKey,
} from './merge'
export * from './copier'
export * from './merge'
export * from './normalize'

export const onStateMessage = <TStateShape extends StateBase>(
  callback: (state: TStateShape) => void,
  socket = window.socket
) => {
  const wrappedCallback = (data: string) => {
    const state = JSON.parse(data)
    callback(state as TStateShape)
  }
  onCommandMessage(labCommand(`s`), wrappedCallback, socket)
}

export const onStateDeltaMessage = <TStateShape extends StateBase>(
  callback: (delta: StateDelta<TStateShape>) => void,
  socket = window.socket
) => {
  const wrappedCallback = (data: string) => {
    const delta = JSON.parse(data)
    callback(delta as PartialDeep<TStateShape>)
  }
  onCommandMessage(labCommand(`d`), wrappedCallback, socket)
}

export type StateBase<TPlayerState = Record<string, any>> = {
  [PLAYER_ENTITY_COLLECTION_KEY]: { [key: string]: TPlayerState }
}

export type StateDelta<T extends StateBase> = PartialStructWithNullPropsDeep<T>

export type StateOptions<TStateShape extends StateBase> = {
  onBeforeSendState?: (state: PartialDeep<TStateShape>) => PartialDeep<TStateShape>
  onStateReceived?: (
    currentState: PartialDeep<TStateShape>,
    newState: PartialDeep<TStateShape>
  ) => PartialDeep<TStateShape>
  onBeforeSendDelta?: (delta: StateDelta<TStateShape>) => StateDelta<TStateShape>
  onDeltaReceived?: (delta: StateDelta<TStateShape>) => StateDelta<TStateShape>
  socket?: PartySocket
  deltaThrottleMs?: number
}
export const useState = <TStateShape extends StateBase>(options?: Partial<StateOptions<TStateShape>>) => {
  const {
    onBeforeSendState = (state: PartialDeep<TStateShape>) => state,
    onStateReceived = (currentState: PartialDeep<TStateShape>, newState: PartialDeep<TStateShape>) => newState,
    onDeltaReceived = (delta: StateDelta<TStateShape>) => delta,
    onBeforeSendDelta = (delta: StateDelta<TStateShape>) => delta,
    socket = window.socket,
    deltaThrottleMs = 50,
  } = options || {}
  let localState: PartialDeep<TStateShape> = { [PLAYER_ENTITY_COLLECTION_KEY]: {} } as PartialDeep<TStateShape>

  onClientJoined((clientId) => {
    console.log('Client joined:', clientId)
    sendStateToClient(clientId)
  }, socket)

  onClientLeft((clientId) => {
    console.log('Client left:', clientId)
    updatePlayerState(clientId, null)
  }, socket)

  const sendStateToClient = (clientId: string) => {
    const stateCopy = onBeforeSendState(deepCopy(localState))
    const filteredState = filterPrivateKeys(stateCopy)
    console.log('Sending state to client', clientId, JSON.stringify(filteredState, null, 2))
    sendCommandMessageToClient(clientId, labCommand(`s`), JSON.stringify(filteredState), socket)
  }

  let pendingDeltaTimeout: NodeJS.Timeout | null = null
  let pendingDelta: StateDelta<TStateShape> = {}

  const maybeSendPendingDeltaToAll = (socket = window.socket) => {
    if (Object.keys(pendingDelta).length === 0 || pendingDeltaTimeout) return
    const deltaCopy = onBeforeSendDelta(deepCopy(pendingDelta))
    const filteredDelta = filterPrivateKeys(deltaCopy)
    // console.log('Sending delta to all', JSON.stringify(filteredDelta, null, 2))
    // TODO filter unchanged delta values
    sendCommandMessageToAll(labCommand(`d`), JSON.stringify(filteredDelta), socket)
    pendingDelta = {}
    pendingDeltaTimeout = setTimeout(() => {
      pendingDeltaTimeout = null
      // console.log(`in timeout, pending delta is`, JSON.stringify(pendingDelta, null, 2))
      maybeSendPendingDeltaToAll(socket)
    }, deltaThrottleMs)
  }

  const { getMyId } = useMyId({ socket })

  onStateMessage<TStateShape>((newState) => {
    // First, normalize the incoming state
    console.log('Received new state from peer', JSON.stringify(newState, null, 2))
    const normalizedState = onStateReceived(localState, newState)
    console.log('Normalized state from peer', JSON.stringify(normalizedState, null, 2))

    const myState = getMyState(true)
    localState = normalizedState
    updateState({ [PLAYER_ENTITY_COLLECTION_KEY]: { [getMyId()]: myState } } as any)
  }, socket)

  onStateDeltaMessage<TStateShape>((delta) => {
    const normalizedDelta = onDeltaReceived(delta)
    console.log('Received delta from client', JSON.stringify(normalizedDelta, null, 2))
    updateState(normalizedDelta as any, false)
  }, socket)

  const getState = (copy = false): PartialDeep<TStateShape> => (copy ? deepCopy(localState) : localState)
  const getPlayerStates = (copy = false): PartialDeep<TStateShape[PlayerEntityCollectionKey]> => {
    return copy ? deepCopy(localState[PLAYER_ENTITY_COLLECTION_KEY]!) : localState[PLAYER_ENTITY_COLLECTION_KEY]!
  }
  const getPlayerState = (
    clientId: string,
    copy = false
  ): PartialDeep<TStateShape[PlayerEntityCollectionKey][string]> | null => {
    const playerState = localState[PLAYER_ENTITY_COLLECTION_KEY]?.[clientId] || {}
    return copy ? deepCopy(playerState) : playerState
  }
  const getMyState = (copy = false): PartialDeep<TStateShape[PlayerEntityCollectionKey][string]> | null => {
    const myId = getMyId()
    return getPlayerState(myId, copy)
  }

  const updatePlayerState = (
    clientId: string,
    delta: PartialStructWithNullPropsDeep<TStateShape[PlayerEntityCollectionKey][string]> | null
  ) => {
    updateState({
      [PLAYER_ENTITY_COLLECTION_KEY]: { [clientId]: delta },
    } as PartialStructWithNullPropsDeep<TStateShape>)
  }

  const updateMyState = (delta: PartialStructWithNullPropsDeep<TStateShape[PlayerEntityCollectionKey][string]>) => {
    const myId = getMyId()
    updatePlayerState(myId, delta)
  }

  const updateState = (delta: PartialStructWithNullPropsDeep<TStateShape>, send = true) => {
    const changes = mergeDeep(localState, delta, true)
    if (!send) return
    if (Object.keys(changes).length > 0) {
      // console.log('Updating state', JSON.stringify({ localState, delta, changes }, null, 2))
    }
    mergeDeep(pendingDelta, changes)
    if (Object.keys(pendingDelta).length > 0) {
      // console.log('Pending delta', JSON.stringify(pendingDelta, null, 2))
    }
    maybeSendPendingDeltaToAll(socket)
  }

  return {
    getState,
    getMyState,
    getPlayerStates,
    getPlayerState,
    updateMyState,
    updatePlayerState,
    updateState,
  }
}
