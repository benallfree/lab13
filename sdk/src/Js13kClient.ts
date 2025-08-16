import PartySocket from 'partysocket'
import { ClientOptions, EventCallback, GameState, GetPlayerState, MessageData, PartialDeep } from './types'
import { deepClone, filterDeltaAgainstBase, mergeState } from './util'

export class Js13kClient<TState extends GameState> {
  private room: string
  private options: Required<ClientOptions<TState>>
  private socket: PartySocket | null
  private myId: string | null
  private localState: TState
  private eventListeners: Record<string, EventCallback[]>
  private connected: boolean
  private remoteState: PartialDeep<TState>
  private pendingUberDelta: PartialDeep<TState>
  private throttleTimer: ReturnType<typeof setTimeout> | null

  constructor(room: string, options: ClientOptions<TState> = {}) {
    this.room = room
    this.options = {
      host: `https://online.js13kgames.com`,
      party: 'js13k',
      deltaEvaluator: (delta, remoteState, playerId) => true,
      deltaNormalizer: (delta) => delta,
      throttleMs: 50,
      debug: false,
      ...options,
    }

    this.socket = null
    this.myId = null
    this.localState = {} as TState
    this.eventListeners = {}
    this.connected = false

    // Delta change detection system
    this.remoteState = {} as PartialDeep<TState>
    this.pendingUberDelta = {} as PartialDeep<TState>
    this.throttleTimer = null

    this.connect()
  }

  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log(`[Js13kClient][${this.myId?.slice(-4) || 'null'}]`, ...args)
    }
  }

  // Check if a delta should be sent based on evaluator function
  shouldSendDelta(delta: PartialDeep<TState>): boolean {
    if (!this.options.deltaEvaluator) {
      return true // Always send if no evaluator provided
    }
    return this.options.deltaEvaluator(delta, this.remoteState, this.myId || undefined)
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
      this.log(`client id`, data.id)
      this.emit('id', this.myId)
    } else if (data.connect) {
      // Another client connected
      this.log(`client connected`, data.connect)
      this.emit('connect', data.connect)
    } else if (data.disconnect) {
      // A client disconnected
      this.log(`client disconnected`, data.disconnect)
      this.emit('disconnect', data.disconnect)
      // Remove their data from state
      if (this.localState.players && this.localState.players[data.disconnect]) {
        this.log(`removing client from state`, data.disconnect)
        delete this.localState.players[data.disconnect]
      }
    } else if (data.state) {
      // Initial state received
      this.log(`initial state received`, JSON.stringify(data.state, null, 2))
      this.localState = data.state
      this.remoteState = this.options.deltaNormalizer(deepClone(data.state))
      this.log(`initial remote state`, JSON.stringify(this.remoteState, null, 2))
      this.emit('state', this.localState)
    } else if (data.delta) {
      // Delta received from another client
      this.log(`delta received`, JSON.stringify(data.delta, null, 2))
      this.localState = mergeState(this.localState, data.delta)
      this.remoteState = mergeState(this.remoteState, this.options.deltaNormalizer(data.delta)) // Update shadow state
      this.emit('delta', data.delta)
    }
  }

  // Event handling
  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event].push(callback)
  }

  off(event: string, callback: EventCallback): void {
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
    return this.localState
  }

  getMyId(): string | null {
    return this.myId
  }

  getMyState(copy: boolean = false): GetPlayerState<TState> | null {
    if (!this.myId || !this.localState.players) return null
    const state = this.localState.players[this.myId]
    return copy ? deepClone(state) : state
  }

  getPlayerState(playerId: string, copy: boolean = false): GetPlayerState<TState> | null {
    if (!this.localState.players || !this.localState.players[playerId]) return null
    const state = this.localState.players[playerId]
    return copy ? deepClone(state) : state
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
    // console.log(`sendDelta`, deltaString)

    this.socket.send(deltaString)
  }

  // Send updates to server with throttling
  updateState(delta: PartialDeep<TState>): void {
    // Merge into pending uberdelta
    this.addToPendingDelta(delta)
  }

  // Merge delta into pending uberdelta
  private addToPendingDelta(delta: PartialDeep<TState>): void {
    // this.log(`addToPendingDelta`, JSON.stringify({ pendingDelta: this.pendingUberDelta, delta }, null, 2))
    // We accumulate raw user changes. No filtering here.

    // Merge delta into the current state (delete on nulls)
    this.localState = mergeState(this.localState, delta, true)

    // Merge incoming delta into current uberdelta but PRESERVE nulls so they can be sent
    this.pendingUberDelta = mergeState(this.pendingUberDelta, delta, false)
    // this.log(`pending uberdelta`, JSON.stringify({ pendingUberDelta: this.pendingUberDelta }, null, 2))

    // Only create a new timer if one doesn't already exist (throttle, not debounce)
    // console.log(`throttleTimer`, JSON.stringify({ throttleTimer: this.throttleTimer }, null, 2))
    if (!this.throttleTimer) {
      // this.log(`no timer set, processing pending delta`)
      this.processPendingDelta()
      this.throttleTimer = setTimeout(() => {
        this.throttleTimer = null
        // this.log(`timer expired, processing pending delta`)
        this.processPendingDelta()
      }, this.options.throttleMs)
    }
  }

  // Process and send pending uberdelta
  private processPendingDelta(): void {
    // console.log(`processPendingDelta`, JSON.stringify({ pendingDelta: this.pendingDelta }, null, 2))
    if (Object.keys(this.pendingUberDelta).length === 0) {
      // this.log(`no pending delta, skipping`)
      return
    }

    // Filter the accumulated uberdelta against last known remote state
    // this.log(
    //   `filtering pending delta against remote state`,
    //   JSON.stringify({ pendingDelta: this.pendingUberDelta, remoteState: this.remoteState }, null, 2)
    // )
    const filteredUberDelta = filterDeltaAgainstBase(
      this.options.deltaNormalizer(this.pendingUberDelta),
      this.remoteState
    ) as PartialDeep<TState> | undefined
    // this.log(`filtered uberdelta`, JSON.stringify({ filteredUberDelta }, null, 2))
    if (!filteredUberDelta || Object.keys(filteredUberDelta).length === 0) {
      // this.log(`no changes after filtering, skipping send`)
    } else if (this.shouldSendDelta(filteredUberDelta)) {
      this.log(`sending pending delta`, JSON.stringify({ pendingDelta: filteredUberDelta }, null, 2))
      // Send the filtered uberdelta
      this.sendDelta(filteredUberDelta)

      // Update shadow state after sending
      this.remoteState = this.options.deltaNormalizer(deepClone(this.localState))
    }

    // Clear pending delta
    this.pendingUberDelta = {} as PartialDeep<TState>
    // this.log(`cleared pending delta`)
    // this.log(`local state`, JSON.stringify({ localState: this.localState }, null, 2))
    // this.log(`remote state`, JSON.stringify({ remoteState: this.remoteState }, null, 2))
  }

  // Update my own data
  updateMyState(delta: PartialDeep<GetPlayerState<TState>>): void {
    // console.log(`updateMyState`, JSON.stringify(delta))
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
    this.pendingUberDelta = {} as PartialDeep<TState>
    this.remoteState = {} as PartialDeep<TState>

    if (this.socket) {
      this.socket.close()
    }
  }
}
