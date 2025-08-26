import type { PartySocket } from 'partysocket'

declare global {
  interface Window {
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

export type PartialOrNullDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialOrNullDeep<T[P]> : T[P] | null
}

function mergeDeep<T extends Record<string, any>>(
  target: T,
  delta: PartialOrNullDeep<T>,
  deleteNulls: boolean = false
): PartialOrNullDeep<T> {
  const changes: any = {}

  for (const key in delta) {
    if (Object.prototype.hasOwnProperty.call(delta, key)) {
      const deltaValue = delta[key]
      const targetValue = target[key]

      if (deltaValue === null) {
        if (deleteNulls) {
          delete target[key]
          changes[key] = undefined as any
        } else {
          target[key] = null as any
          changes[key] = null as any
        }
      } else if (
        deltaValue &&
        typeof deltaValue === 'object' &&
        !Array.isArray(deltaValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        const nestedChanges = mergeDeep(targetValue, deltaValue, deleteNulls)
        if (Object.keys(nestedChanges).length > 0) {
          changes[key] = nestedChanges as any
        }
      } else if (deltaValue !== targetValue) {
        target[key] = deltaValue as any
        changes[key] = deltaValue
      }
    }
  }

  return changes
}

export const deepCopy = <T extends object>(obj: T): T => JSON.parse(JSON.stringify(obj))

export type PositionLike = Partial<{ x: number; y: number; z: number }>
export const normalizePosition = <T extends PositionLike>(target: T, precision = 0): T => {
  if (typeof target !== 'object' || target === null) return target
  const round = (n: number) =>
    precision === 0 ? Math.round(n) : Math.round(n * Math.pow(10, precision)) / Math.pow(10, precision)
  for (const key in target) {
    if (!Object.prototype.hasOwnProperty.call(target, key)) continue
    const value = target[key]
    if (key === 'x' || key === 'y' || key === 'z') {
      if (typeof value === 'number') {
        target[key] = round(value) as any
      }
    } else if (typeof value === 'object' && value !== null) {
      normalizePosition(value, precision)
    }
  }
  return target
}

export type RotationLike = Partial<{ rx: number; ry: number; rz: number }>
export const normalizeRotation = <T extends RotationLike>(target: T, precision = 2): T => {
  if (typeof target !== 'object' || target === null) return target
  const round = (n: number) =>
    precision === 0 ? Math.round(n) : Math.round(n * Math.pow(10, precision)) / Math.pow(10, precision)
  const normalizeRad = (n: number) => {
    const twoPi = Math.PI * 2
    n = n % twoPi
    if (n < 0) n += twoPi
    return n
  }
  for (const key in target) {
    if (!Object.prototype.hasOwnProperty.call(target, key)) continue
    const value = target[key]
    if (key === 'rx' || key === 'ry' || key === 'rz') {
      if (typeof value === 'number') {
        // Normalize radians to [0, 2π)
        target[key] = round(normalizeRad(value)) as any
      }
    } else if (typeof value === 'object' && value !== null) {
      normalizeRotation(value, precision)
    }
  }
  return target
}

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

export type StateBase = Record<string, any> & {
  _players: Record<string, any>
}

export type StateDelta<T extends StateBase> = PartialOrNullDeep<T> | null

export type StateOptions<TStateShape extends StateBase> = {
  onBeforeSendState?: (state: TStateShape) => TStateShape
  onStateReceived?: (currentState: TStateShape, newState: TStateShape) => TStateShape
  onBeforeSendDelta?: (delta: StateDelta<TStateShape>) => StateDelta<TStateShape>
  onDeltaReceived?: (delta: StateDelta<TStateShape>) => StateDelta<TStateShape>
  socket?: PartySocket
  deltaThrottleMs?: number
}
export const useState = <TStateShape extends StateBase>(options?: Partial<StateOptions<TStateShape>>) => {
  const {
    onBeforeSendState = (state: TStateShape) => state,
    onStateReceived = (currentState: TStateShape, newState: TStateShape) => newState,
    onDeltaReceived = (delta: StateDelta<TStateShape>) => delta,
    onBeforeSendDelta = (delta: StateDelta<TStateShape>) => delta,
    socket = window.socket,
    deltaThrottleMs = 50,
  } = options || {}
  let localState: TStateShape = { _players: {} } as TStateShape

  onClientJoined((clientId) => {
    console.log('Client joined:', clientId)
    sendStateToClient(clientId)
  }, socket)

  const sendStateToClient = (clientId: string) => {
    const stateCopy = onBeforeSendState(deepCopy(localState))
    console.log('Sending state to client', clientId, JSON.stringify(stateCopy, null, 2))
    sendCommandMessageToClient(clientId, labCommand(`s`), JSON.stringify(stateCopy), socket)
  }

  let pendingDeltaTimeout: NodeJS.Timeout | null = null
  let pendingDelta: StateDelta<TStateShape> = null

  const maybeSendPendingDeltaToAll = (socket = window.socket) => {
    if (!pendingDelta || Object.keys(pendingDelta).length === 0 || pendingDeltaTimeout) return
    const deltaCopy = onBeforeSendDelta(deepCopy(pendingDelta))
    // TODO filter unchanged delta values
    sendCommandMessageToAll(labCommand(`d`), JSON.stringify(deltaCopy), socket)
    pendingDelta = null
    pendingDeltaTimeout = setTimeout(() => {
      pendingDeltaTimeout = null
      maybeSendPendingDeltaToAll(socket)
    }, deltaThrottleMs)
  }

  const { getMyId } = useMyId()

  onStateMessage<TStateShape>((newState) => {
    console.log('Received new state from peer', JSON.stringify(newState, null, 2))
    const normalizedState = onStateReceived(localState, newState)
    console.log('Normalized state from peer', JSON.stringify(normalizedState, null, 2))
    const changes = mergeDeep(localState, normalizedState, true)
    console.log('Changes to send to all', JSON.stringify(changes, null, 2))
    sendCommandMessageToAll(labCommand(`d`), JSON.stringify(changes), socket)
  }, socket)

  onStateDeltaMessage<TStateShape>((delta) => {
    const normalizedDelta = onDeltaReceived(delta)
    console.log('Received delta from client', JSON.stringify(normalizedDelta, null, 2))
    mergeDeep(localState, normalizedDelta as any)
  }, socket)

  const getState = (copy = false): PartialDeep<TStateShape> => (copy ? deepCopy(localState) : localState)
  const getPlayerState = (clientId: string, copy = false): PartialDeep<TStateShape['_players'][string]> | null => {
    return copy ? deepCopy(localState._players[clientId] || {}) : localState._players[clientId] || {}
  }
  const getMyState = (copy = false): PartialDeep<TStateShape['_players'][string]> | null => {
    const myId = getMyId()
    if (!myId) {
      return null
    }
    return getPlayerState(myId, copy)
  }

  const updatePlayerState = (clientId: string, delta: PartialOrNullDeep<TStateShape['_players'][string]> | null) => {
    if (!localState._players[clientId]) {
      localState._players[clientId] = {}
    }
    const changes = mergeDeep(localState, { _players: { [clientId]: delta } } as PartialOrNullDeep<TStateShape>, true)
    if (!pendingDelta) {
      pendingDelta = {}
    }
    mergeDeep(pendingDelta, changes)
    console.log('Pending delta', JSON.stringify(pendingDelta, null, 2))
    maybeSendPendingDeltaToAll(socket)
  }

  const updateMyState = (delta: PartialOrNullDeep<TStateShape['_players'][string]>) => {
    const myId = getMyId()
    if (!myId) {
      return
    }
    updatePlayerState(myId, delta)
  }

  return {
    getState,
    getMyState,
    updateMyState,
    updatePlayerState,
  }
}

export type UseMyIdOptions = {
  socket?: PartySocket
}

export const useMyId = (options?: Partial<UseMyIdOptions>) => {
  const { socket = window.socket } = options || {}
  let myId: string | null = null
  onClientIdUpdated((clientId) => {
    // console.log('My ID updated:', clientId)
    myId = clientId
  }, socket)
  return {
    getMyId: () => myId,
  }
}
