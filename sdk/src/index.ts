import PartySocket from 'partysocket'

// Type definitions
type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P]
}

export type DeltaEvaluator<TState = GameState> = (
  delta: PartialDeep<TState>,
  deltaBase: PartialDeep<TState>,
  playerId?: string
) => boolean

export interface ClientOptions<TState = GameState> {
  host?: string
  party?: string
  deltaEvaluator?: DeltaEvaluator<TState>
  throttleMs?: number
}

export interface MessageData {
  id?: string
  connect?: string
  disconnect?: string
  state?: any
  delta?: any
}

export type GameState = Record<string, any>

export type GetPlayerState<TState extends GameState> = TState['players'][string]

// Helper function to generate UUIDs for game objects
export function generateUUID(): string {
  return (([1e7] as any) + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: number) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  )
}

class Js13kClient<TState extends GameState> {
  private room: string
  private options: Required<
    ClientOptions<TState> & { deltaEvaluator: DeltaEvaluator<TState> | undefined; throttleMs: number }
  >
  private socket: PartySocket | null
  private myId: string | null
  private state: TState
  private eventListeners: Record<string, Function[]>
  private connected: boolean
  private shadowState: PartialDeep<TState>
  private pendingDelta: PartialDeep<TState>
  private throttleTimer: ReturnType<typeof setTimeout> | null

  constructor(room: string, options: ClientOptions<TState> = {}) {
    this.room = room
    this.options = {
      host: `https://js13k-mmo.benallfree.com`,
      party: 'js13k',
      deltaEvaluator: undefined,
      throttleMs: 50,
      ...options,
    }

    this.socket = null
    this.myId = null
    this.state = {} as TState
    this.eventListeners = {}
    this.connected = false

    // Delta change detection system
    this.shadowState = {} as PartialDeep<TState>
    this.pendingDelta = {} as PartialDeep<TState>
    this.throttleTimer = null

    this.connect()
  }

  // Check if a delta should be sent based on evaluator function
  shouldSendDelta(delta: PartialDeep<TState>): boolean {
    if (!this.options.deltaEvaluator) {
      return true // Always send if no evaluator provided
    }
    return this.options.deltaEvaluator(delta, this.shadowState, this.myId || undefined)
  }

  connect(): void {
    this.socket = new PartySocket({
      host: this.options.host,
      party: this.options.party,
      room: this.room,
    })

    this.socket.addEventListener('open', () => {
      this.connected = true
      this.emit('connected')
    })

    this.socket.addEventListener('close', () => {
      this.connected = false
      this.emit('disconnected')
    })

    this.socket.addEventListener('message', (event) => {
      try {
        const data: MessageData = JSON.parse(event.data)
        this.handleMessage(data)
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    })
  }

  handleMessage(data: MessageData): void {
    if (data.id) {
      // Received my own ID from server
      this.myId = data.id
      this.emit('id', this.myId)
    } else if (data.connect) {
      // Another client connected
      this.emit('connect', data.connect)
    } else if (data.disconnect) {
      // A client disconnected
      this.emit('disconnect', data.disconnect)
      // Remove their data from state
      if (this.state.players && this.state.players[data.disconnect]) {
        delete this.state.players[data.disconnect]
      }
    } else if (data.state) {
      // Initial state received
      this.state = data.state
      this.emit('state', this.state)
    } else if (data.delta) {
      // Delta received from another client
      this.state = this.mergeState(this.state, data.delta)
      this.emit('delta', data.delta)
    }
  }

  // Simple recursive merge function (same as server)
  mergeState(target: any, source: any): any {
    if (typeof source !== 'object' || source === null) {
      return source
    }

    if (typeof target !== 'object' || target === null) {
      target = {}
    }

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        target[key] = this.mergeState(target[key], source[key])
      }
    }

    return target
  }

  // Event handling
  on(event: string, callback: Function): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event].push(callback)
  }

  off(event: string, callback: Function): void {
    if (this.eventListeners[event]) {
      const index = this.eventListeners[event].indexOf(callback)
      if (index > -1) {
        this.eventListeners[event].splice(index, 1)
      }
    }
  }

  emit(event: string, data?: any): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in event listener:', error)
        }
      })
    }
  }

  // State management
  getState(): TState {
    return this.state
  }

  getMyId(): string | null {
    return this.myId
  }

  getMyState(copy: boolean = false): GetPlayerState<TState> | null {
    if (!this.myId || !this.state.players) return null
    const state = this.state.players[this.myId]
    return copy ? JSON.parse(JSON.stringify(state)) : state
  }

  getPlayerState(playerId: string, copy: boolean = false): GetPlayerState<TState> | null {
    if (!this.state.players || !this.state.players[playerId]) return null
    const state = this.state.players[playerId]
    return copy ? JSON.parse(JSON.stringify(state)) : state
  }

  isConnected(): boolean {
    return this.connected
  }

  // Send updates to server
  sendDelta(delta: PartialDeep<TState>): void {
    if (!this.socket || !this.connected) {
      console.warn('Not connected to server, skipping delta')
      return
    }
    const deltaString = JSON.stringify({ delta })
    // console.log(`[${this.myId}] sendDelta`, deltaString)

    this.socket.send(deltaString)
  }

  // Send updates to server with throttling
  updateState(delta: PartialDeep<TState>): void {
    // Merge into pending uberdelta
    this.addToPendingDelta(delta)
  }

  // Merge delta into pending uberdelta
  private addToPendingDelta(delta: PartialDeep<TState>): void {
    // console.log(`[${this.myId}] addToPendingDelta`, JSON.stringify({ pendingDelta: this.pendingDelta, delta }, null, 2))
    // If this is the first pending update, capture the current state as shadow state
    if (Object.keys(this.pendingDelta).length === 0) {
      this.shadowState = JSON.parse(JSON.stringify(this.state))
      // console.log(
      //   `[${this.myId}] initializing shadow state`,
      //   JSON.stringify({ shadowState: this.shadowState }, null, 2)
      // )
    }

    // Merge delta into the current state
    this.state = this.mergeState(this.state, delta)

    // Merge delta into the pending uberdelta
    this.pendingDelta = this.mergeState(this.pendingDelta, delta)

    // Only create a new timer if one doesn't already exist (throttle, not debounce)
    // console.log(`[${this.myId}] throttleTimer`, JSON.stringify({ throttleTimer: this.throttleTimer }, null, 2))
    if (!this.throttleTimer) {
      this.processPendingDelta()
      this.throttleTimer = setTimeout(() => {
        this.throttleTimer = null
        this.processPendingDelta()
      }, this.options.throttleMs)
    }
  }

  // Process and send pending uberdelta
  private processPendingDelta(): void {
    // console.log(`[${this.myId}] processPendingDelta`, JSON.stringify({ pendingDelta: this.pendingDelta }, null, 2))
    if (Object.keys(this.pendingDelta).length === 0) return

    // Check if pending delta should be sent
    if (this.shouldSendDelta(this.pendingDelta)) {
      // console.log(`[${this.myId}] sending pending delta`, JSON.stringify({ pendingDelta: this.pendingDelta }, null, 2))
      // Send the uberdelta
      this.sendDelta(this.pendingDelta)

      // Clear shadow state after sending
      this.shadowState = {} as PartialDeep<TState>
    }

    // Clear pending delta and timer
    this.pendingDelta = {} as PartialDeep<TState>
  }

  // Update my own data
  updateMyState(delta: PartialDeep<GetPlayerState<TState>>): void {
    // console.log(`[${this.myId}] updateMyState`, JSON.stringify(delta))
    if (this.myId) {
      this.updateState({ players: { [this.myId]: delta } } as unknown as PartialDeep<TState>)
    } else {
      console.warn('No myId yet, waiting for server...')
    }
  }

  // Disconnect
  disconnect(): void {
    // Clear throttle timer
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer)
      this.throttleTimer = null
    }
    this.pendingDelta = {} as PartialDeep<TState>
    this.shadowState = {} as PartialDeep<TState>

    if (this.socket) {
      this.socket.close()
    }
  }
}

// Export for use in modules
export default Js13kClient

// Also make available globally for non-module usage
declare global {
  interface Window {
    Js13kClient: typeof Js13kClient
  }
}

if (typeof window !== 'undefined') {
  window.Js13kClient = Js13kClient
}
