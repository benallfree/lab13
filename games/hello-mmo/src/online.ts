import type { PartySocket } from 'partysocket'

declare global {
  interface Window {
    PartySocket: typeof PartySocket
    socket: PartySocket
  }
}

export const onOpen = (callback: () => void, socket = window.socket) => {
  socket.addEventListener('open', callback)
}
export const onClose = (callback: () => void, socket = window.socket) => {
  socket.addEventListener('close', callback)
}
export const onError = (callback: () => void, socket = window.socket) => {
  socket.addEventListener('error', callback)
}
export const onCommandMessage = (command: string, callback: (data: string) => void, socket = window.socket) => {
  socket.addEventListener('message', (event) => {
    const data = event.data.toString()
    if (data.startsWith(command)) {
      callback(data.slice(command.length))
    }
  })
}
export const sendMessage = (message: string, socket = window.socket) => {
  socket.send(message)
}
export const sendMessageToClient = (clientId: string, message: string, socket = window.socket) => {
  sendMessage(`@${clientId}|${message}`, socket)
}
export const sendCommandMessageToClient = (clientId: string, command: string, data: string, socket = window.socket) => {
  sendMessageToClient(clientId, `${command}${data}`, socket)
}
export const sendCommandMessageToAll = (command: string, data: string, socket = window.socket) => {
  sendMessage(`${command}${data}`, socket)
}
export const onClientJoined = (callback: (clientId: string) => void, socket = window.socket) => {
  onCommandMessage(`+`, callback, socket)
}
export const onClientLeft = (callback: (clientId: string) => void, socket = window.socket) => {
  onCommandMessage(`-`, callback, socket)
}
export const onClientIdUpdated = (callback: (myClientId: string) => void, socket = window.socket) => {
  onCommandMessage(`@`, callback, socket)
}
export const onMyIdUpdated = onClientIdUpdated
const labCommand = (command: string) => `_${command}`
export const sendIdentToClient = (recipientClientId: string, clientId: string, socket = window.socket) => {
  sendCommandMessageToClient(recipientClientId, labCommand(`i`), clientId, socket)
}
export const onIdentReceived = (callback: (fromClientId: string) => void, socket = window.socket) => {
  onCommandMessage(labCommand(`i`), callback, socket)
}
export const usePresence = (socket = window.socket) => {
  onClientJoined((clientId) => {
    console.log(`[${myClientId}] client joined`, clientId)
    if (myClientId) {
      sendIdentToClient(clientId, myClientId, socket)
    }
  }, socket)

  let myClientId: string | null = null
  onClientIdUpdated((clientId) => {
    console.log(`[${myClientId}] player id updated`, clientId)
    myClientId = clientId
  }, socket)
}

export type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P]
}

export type PartialStructWithNullPropsDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialStructWithNullPropsDeep<T[P]> | null : T[P] | null
}

export const PRIVATE_KEY_PREFIX = '_'
export type PrivateKeyPrefix = typeof PRIVATE_KEY_PREFIX
export type PrivateKey = `${PrivateKeyPrefix}${string}`
export const PRIVATE_KEY_COLLECTION_KEY: PrivateKey = `${PRIVATE_KEY_PREFIX}keys`

export const ENTITY_COLLECTION_PREFIX = '@'
export type EntityCollectionPrefix = typeof ENTITY_COLLECTION_PREFIX
export type EntityCollectionKey = `${EntityCollectionPrefix}${string}`
export type PlayerEntityCollectionKey = `${EntityCollectionPrefix}players`
export const PLAYER_ENTITY_COLLECTION_KEY: PlayerEntityCollectionKey = `${ENTITY_COLLECTION_PREFIX}players`

const tombstones = new Set<string>()
function mergeDeep<T extends Record<string, any>>(
  target: T,
  delta: PartialStructWithNullPropsDeep<T>,
  deleteNulls = false,
  parentKey?: string
): PartialStructWithNullPropsDeep<T> {
  const changes: any = {}

  const deleteKey = (key: string) => {
    if (deleteNulls) {
      delete target[key]
    } else {
      target[key as keyof T] = null as any
    }
    changes[key] = null as any
    if (parentKey?.startsWith(ENTITY_COLLECTION_PREFIX)) {
      tombstones.add(key)
    }
  }

  const isTombstoned = (key: string) => parentKey?.startsWith(ENTITY_COLLECTION_PREFIX) && tombstones.has(key)

  Object.keys(delta).forEach((key) => {
    if (isTombstoned(key)) {
      deleteKey(key)
      return
    }

    const deltaValue = delta[key]
    const targetValue = target[key]

    if (deltaValue === null) {
      deleteKey(key)
    } else if (
      deltaValue &&
      typeof deltaValue === 'object' &&
      !Array.isArray(deltaValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      const nestedChanges = mergeDeep(targetValue, deltaValue, deleteNulls, key)
      if (Object.keys(nestedChanges).length > 0) {
        changes[key] = nestedChanges as any
      }
    } else if (deltaValue !== targetValue) {
      target[key as keyof T] = deltaValue as any
      changes[key] = deltaValue
    }
  })
  return changes
}

export const deepCopy = <T extends object>(obj: T): T => JSON.parse(JSON.stringify(obj))
export const round = (n: number, precision = 0) =>
  precision === 0 ? Math.round(n) : Math.round(n * Math.pow(10, precision)) / Math.pow(10, precision)

export const normalizeRad = (n: number) => {
  const twoPi = Math.PI * 2
  n = n % twoPi
  if (n < 0) n += twoPi
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

export const createRotationNormalizer = <TState extends Record<string, any>>(precision = 2) =>
  createKeyNormalizer((obj, key, value) => {
    if (['rx', 'ry', 'rz'].includes(key)) {
      const round = (n: number) =>
        precision === 0 ? Math.round(n) : Math.round(n * Math.pow(10, precision)) / Math.pow(10, precision)
      return round(normalizeRad(value))
    }
    return value
  })
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
    updateMyState,
    updatePlayerState,
    updateState,
  }
}

export type UseMyIdOptions = {
  socket?: PartySocket
}

export const useMyId = (options?: Partial<UseMyIdOptions>) => {
  const { socket = window.socket } = options || {}
  console.log('Socket ID:', socket.id)
  let myId: string = socket.id
  onClientIdUpdated((clientId) => {
    // console.log('My ID updated:', clientId)
    myId = clientId
  }, socket)
  return {
    getMyId: () => myId,
  }
}

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

export type OnlineOptions = {
  host?: string
  global?: boolean
}
export const useOnline = (room: string, options?: Partial<OnlineOptions>) => {
  const roomParts = room.split('/')
  const { host = 'relay.js13kgames.com', global = true } = options || {}
  const socket = new window.PartySocket({
    host,
    party: roomParts[0],
    room: roomParts.join('/'),
  })
  if (global) {
    window.socket = socket
  }
  return socket
}

export const generateUUID = (): string => Math.random().toString(36).substring(2, 15)

// Utility function to filter out private keys from state/delta objects
export const filterPrivateKeys = <T extends Record<string, any>>(obj: T): T => {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  const filtered = { ...obj } as any

  // Filter out any keys that start with the private key prefix
  Object.keys(filtered).forEach((key) => {
    if (key.startsWith(PRIVATE_KEY_PREFIX)) {
      delete filtered[key]
    } else if (typeof filtered[key] === 'object' && filtered[key] !== null) {
      // Recursively filter nested objects
      filtered[key] = filterPrivateKeys(filtered[key])
    }
  })

  return filtered as T
}
