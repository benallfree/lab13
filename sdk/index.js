import PartySocket from 'https://esm.sh/partysocket'

// Helper function to create a delta throttler
export function createDeltaThrottle(ms = 50) {
  const lastSent = new Map()

  return (newDelta, deltaBase, key) => {
    const now = Date.now()
    const lastTime = lastSent.get(key) || 0

    // Check if enough time has passed
    const timeCheck = now - lastTime >= ms

    // Check if values have actually changed (deep comparison)
    const valueCheck = !deltaBase || hasValueChanged(newDelta, deltaBase)

    return {
      check: timeCheck && valueCheck,
      commit: () => {
        // Always reset the timer when commit is called
        lastSent.set(key, Date.now())
      },
    }
  }
}

// Helper function to create a 2D distance-based evaluator
export function createDistance2DEvaluator(minDistance = 5) {
  return (newDelta, deltaBase, key) => {
    if (!deltaBase || newDelta.x === undefined || newDelta.y === undefined) {
      return { check: true, commit: () => {} }
    }

    const dx = newDelta.x - (deltaBase.x || 0)
    const dy = newDelta.y - (deltaBase.y || 0)
    const check = Math.sqrt(dx * dx + dy * dy) > minDistance

    return { check, commit: () => {} }
  }
}

// Helper function to create a 3D distance-based evaluator
export function createDistance3DEvaluator(minDistance = 5) {
  return (newDelta, deltaBase, key) => {
    if (!deltaBase || newDelta.x === undefined || newDelta.y === undefined || newDelta.z === undefined) {
      return { check: true, commit: () => {} }
    }

    const dx = newDelta.x - (deltaBase.x || 0)
    const dy = newDelta.y - (deltaBase.y || 0)
    const dz = newDelta.z - (deltaBase.z || 0)
    const check = Math.sqrt(dx * dx + dy * dy + dz * dz) > minDistance

    return { check, commit: () => {} }
  }
}

// Helper function to create a percentage-based evaluator
export function createPercentageEvaluator(property, minPercentage = 0.1) {
  return (newDelta, deltaBase, key) => {
    if (!deltaBase || newDelta[property] === undefined || deltaBase[property] === undefined) {
      return { check: true, commit: () => {} }
    }

    const change = Math.abs(newDelta[property] - deltaBase[property])
    const check = change > Math.abs(deltaBase[property]) * minPercentage

    return { check, commit: () => {} }
  }
}

// Helper function for deep value comparison
function hasValueChanged(delta, base) {
  if (typeof delta !== typeof base) return true

  if (typeof delta !== 'object' || delta === null) {
    return delta !== base
  }

  for (const key of Object.keys(delta)) {
    if (!(key in base)) return true
    if (hasValueChanged(delta[key], base[key])) return true
  }

  return false
}

export const defaultThrottle = createDeltaThrottle(50)

// Helper function to generate a deterministic key from delta structure
function generateDeltaKey(delta, path = '') {
  if (typeof delta !== 'object' || delta === null) {
    return path
  }

  const keys = Object.keys(delta).sort()
  if (keys.length === 0) {
    return path
  }

  const keyParts = keys.map((key) => {
    const value = delta[key]
    if (typeof value === 'object' && value !== null) {
      return `${key}:${generateDeltaKey(value, path + key + '.')}`
    }
    return key
  })

  return path + keyParts.join('.')
}

// Helper function to get nested value from state using delta structure
function getNestedValue(state, delta) {
  if (typeof delta !== 'object' || delta === null) {
    return state
  }

  // Recursively extract the nested structure that matches the delta
  const result = {}
  for (const key of Object.keys(delta)) {
    if (state && typeof state === 'object' && key in state) {
      if (typeof delta[key] === 'object' && delta[key] !== null) {
        // Recursively get nested values
        result[key] = getNestedValue(state[key], delta[key])
      } else {
        // Leaf value
        result[key] = state[key]
      }
    } else {
      return undefined
    }
  }
  return result
}

class Js13kClient {
  constructor(room, options = {}) {
    this.room = room
    this.options = {
      host: window.location.host,
      party: 'js13k',
      ...options,
    }

    this.socket = null
    this.myId = null
    this.state = {}
    this.eventListeners = {}
    this.connected = false

    // Delta change detection system
    this.deltaBases = new Map()
    this.hasSignificantChange = options.hasSignificantChange || (() => true)

    this.connect()
  }

  // Save a base state for a given delta key
  saveDeltaBase(key, deltaBaseState) {
    this.deltaBases.set(key, JSON.parse(JSON.stringify(deltaBaseState)))
  }

  // Get the base state for a given delta key
  getDeltaBase(key) {
    return this.deltaBases.get(key)
  }

  // Automatically get or create delta base from current state
  getOrCreateDeltaBase(delta) {
    const key = generateDeltaKey(delta)

    // Check if we already have a saved base
    let baseState = this.getDeltaBase(key)

    if (!baseState) {
      // Extract base state from current state using delta structure
      baseState = getNestedValue(this.state, delta)

      // Save the base state for future comparisons
      if (baseState !== undefined) {
        this.saveDeltaBase(key, baseState)
      }
    }

    return { key, baseState }
  }

  // Check if a delta has significant changes
  checkSignificantChange(delta, evaluator = null) {
    const { key, baseState } = this.getOrCreateDeltaBase(delta)

    if (!evaluator) {
      // Use default throttler
      evaluator = defaultThrottle(delta, baseState, key)
    }

    // Handle result object evaluators
    const result = evaluator(delta, baseState, key)

    if (result.check) {
      result.commit()
      return true
    }

    return false
  }

  connect() {
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
        const data = JSON.parse(event.data)
        this.handleMessage(data)
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    })
  }

  handleMessage(data) {
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
  mergeState(target, source) {
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
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event].push(callback)
  }

  off(event, callback) {
    if (this.eventListeners[event]) {
      const index = this.eventListeners[event].indexOf(callback)
      if (index > -1) {
        this.eventListeners[event].splice(index, 1)
      }
    }
  }

  emit(event, data) {
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
  getState() {
    return this.state
  }

  getMyId() {
    return this.myId
  }

  getMyState(copy = false) {
    if (!this.myId || !this.state.players) return null
    const state = this.state.players[this.myId]
    return copy ? JSON.parse(JSON.stringify(state)) : state
  }

  getPlayerState(playerId, copy = false) {
    if (!this.state.players || !this.state.players[playerId]) return null
    const state = this.state.players[playerId]
    return copy ? JSON.parse(JSON.stringify(state)) : state
  }

  isConnected() {
    return this.connected
  }

  // Send updates to server
  sendDelta(delta, evaluator = null) {
    if (this.socket && this.connected) {
      this.state = this.mergeState(this.state, delta)

      // Check if this delta has significant changes
      if (!this.checkSignificantChange(delta, evaluator)) {
        // Update local state but don't send to server
        return
      }

      this.socket.send(JSON.stringify({ delta }))
    }
  }

  // Update my own data
  updateMyData(delta, evaluator = null) {
    if (this.myId) {
      this.sendDelta({ players: { [this.myId]: delta } }, evaluator)
    } else {
      console.warn('No myId yet, waiting for server...')
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.close()
    }
  }
}

// Export for use in modules
export default Js13kClient

// Also make available globally for non-module usage
if (typeof window !== 'undefined') {
  window.Js13kClient = Js13kClient
}
