import { DeltaMiddleware } from '../middlewares/types'
import { GameState, PartialDeep } from '../types'
import { deepMerge } from '../util/deepMerge'

export type StatePluginOptions<T extends GameState> = {
  localMiddleware?: DeltaMiddleware<T>[]
  outgoingMiddleware?: DeltaMiddleware<T>[]
  incomingMiddleware?: DeltaMiddleware<T>[]
  throttleMs?: number
}

export type StatePluginApi<T extends GameState> = {
  state: () => T
  localState: () => T
  remoteState: () => T
  mutateState: (delta: PartialDeep<T>) => void
}

export const state = <T extends GameState>(options: StatePluginOptions<T> = {}) => {
  const { localMiddleware = [], outgoingMiddleware = [], incomingMiddleware = [], throttleMs = 50 } = options

  // Separate local and remote state
  let localState: T = {} as T
  let remoteState: T = {} as T

  // Throttling mechanism for outgoing deltas
  let pendingUberDelta: PartialDeep<T> = {} as PartialDeep<T>
  let throttleTimer: NodeJS.Timeout | null = null

  // Generic middleware pipeline runner
  const runMiddlewarePipeline = (
    middlewares: DeltaMiddleware<T>[],
    state: T,
    delta: PartialDeep<T>
  ): PartialDeep<T> => {
    let processedDelta = delta

    for (const middleware of middlewares) {
      let nextCalled = false
      middleware(state, processedDelta, (newDelta) => {
        processedDelta = newDelta
        nextCalled = true
      })
      if (!nextCalled) {
        // Middleware didn't call next, stop processing
        return processedDelta
      }
    }

    return processedDelta
  }

  // Apply local middleware pipeline
  const applyLocalMiddleware = (delta: PartialDeep<T>): PartialDeep<T> => {
    return runMiddlewarePipeline(localMiddleware, localState, delta)
  }

  // Apply outgoing remote middleware pipeline
  const applyOutgoingRemoteMiddleware = (delta: PartialDeep<T>): PartialDeep<T> => {
    return runMiddlewarePipeline(outgoingMiddleware, localState, delta)
  }

  // Apply incoming remote middleware pipeline
  const applyIncomingRemoteMiddleware = (delta: PartialDeep<T>): PartialDeep<T> => {
    return runMiddlewarePipeline(incomingMiddleware, remoteState, delta)
  }

  // Update both local and remote state
  const updateBothStates = (delta: PartialDeep<T>) => {
    localState = deepMerge(localState, delta) as T
    remoteState = deepMerge(remoteState, delta) as T
  }

  const sendPendingDelta = (socket: any) => {
    if (Object.keys(pendingUberDelta).length > 0) {
      socket.send(`d${JSON.stringify(pendingUberDelta)}`)
      pendingUberDelta = {} as PartialDeep<T>
    }
    throttleTimer = null
  }

  const scheduleDeltaSend = (socket: any) => {
    if (throttleTimer) {
      return // Already scheduled
    }
    // Send immediately if no timer is active
    sendPendingDelta(socket)
    // Then start timer for subsequent changes
    throttleTimer = setTimeout(() => sendPendingDelta(socket), throttleMs)
  }

  const addToPendingDelta = (delta: PartialDeep<T>, socket: any) => {
    pendingUberDelta = deepMerge(pendingUberDelta, delta) as PartialDeep<T>
    scheduleDeltaSend(socket)
  }

  return (client: any) => {
    const socket = client.socket

    // Set up event listeners for state management
    socket.addEventListener('lab-command', (event: any) => {
      const labCommand = event.detail
      switch (labCommand[0]) {
        case '?':
          if (labCommand[1] === 's') {
            const replyId = labCommand.slice(2)
            client.sendToPlayer(replyId, `_.s${JSON.stringify(remoteState)}`)
          }
          break
        case '.':
          if (labCommand[1] === 's') {
            const stateData = labCommand.slice(2)
            try {
              const newState = JSON.parse(stateData)
              remoteState = newState
              localState = newState
              socket.dispatchEvent(
                new CustomEvent('state-updated', {
                  detail: { state: localState },
                })
              )
            } catch (e) {
              console.error('Failed to parse state data:', e)
            }
          } else if (labCommand[1] === 'i') {
            // Handle roll call response with state update
            const responseData = labCommand.slice(2)
            const [newClientId, isBotFlag] = responseData.split('|')
            if (newClientId) {
              const delta = createPlayerDelta(newClientId, !!isBotFlag)
              updateBothStates(delta)
            }
          }
          break
        case 'd':
          const deltaData = labCommand.slice(1)
          try {
            const delta = JSON.parse(deltaData)
            // Apply incoming remote middleware before updating both states
            const processedDelta = applyIncomingRemoteMiddleware(delta)
            updateBothStates(processedDelta)
            socket.dispatchEvent(
              new CustomEvent('state-updated', {
                detail: { state: localState, delta: processedDelta },
              })
            )
          } catch (e) {
            console.error('Failed to parse delta:', e)
          }
          break
      }
    })

    // Create synthetic delta for player/bot management
    const createPlayerDelta = (clientId: string, isBot: boolean = false) => {
      if (isBot) {
        return {
          _players: { [clientId]: null },
          _bots: { [clientId]: { id: clientId } },
        } as PartialDeep<T>
      } else {
        return {
          _players: { [clientId]: { id: clientId } },
          _bots: { [clientId]: null },
        } as PartialDeep<T>
      }
    }

    const createDisconnectDelta = (clientId: string) => {
      return {
        _players: { [clientId]: null },
        _bots: { [clientId]: null },
      } as PartialDeep<T>
    }

    // Handle client connection with state update
    socket.addEventListener('client-connected', (event: any) => {
      const newClientId = event.detail
      const playerDelta = createPlayerDelta(newClientId, false)
      updateBothStates(playerDelta)
    })

    // Handle client disconnection with state update
    socket.addEventListener('client-disconnected', (event: any) => {
      const disconnectedClientId = event.detail
      const disconnectDelta = createDisconnectDelta(disconnectedClientId)
      updateBothStates(disconnectDelta)
    })

    // Handle bot announcement with state update
    socket.addEventListener('bot-announced', (event: any) => {
      const botId = event.detail
      const botDelta = createPlayerDelta(botId, true)
      updateBothStates(botDelta)
    })

    // Extend the client with state functionality
    const stateApi: StatePluginApi<T> = {
      state: () => localState,
      localState: () => localState,
      remoteState: () => remoteState,
      mutateState: (delta: PartialDeep<T>) => {
        // Apply local middleware first
        const localProcessedDelta = applyLocalMiddleware(delta)

        // Apply to local state
        localState = deepMerge(localState, localProcessedDelta) as T

        // Apply outgoing remote middleware
        const remoteProcessedDelta = applyOutgoingRemoteMiddleware(localProcessedDelta)

        // Apply to remote state so it's ready for snapshot requests
        remoteState = deepMerge(remoteState, remoteProcessedDelta) as T

        // Add to pending uberDelta for throttled sending
        addToPendingDelta(remoteProcessedDelta, socket)

        // Dispatch event with local state update
        socket.dispatchEvent(
          new CustomEvent('state-updated', {
            detail: { state: localState, delta: localProcessedDelta },
          })
        )
      },
    }

    // Return the plugin's public API
    return stateApi
  }
}
