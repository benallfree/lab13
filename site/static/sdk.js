import PartySocket from 'https://esm.sh/partysocket'

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

    this.connect()
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
  sendDelta(delta) {
    if (this.socket && this.connected) {
      this.socket.send(JSON.stringify({ delta }))
      // Also update local state immediately for smooth updates
      this.state = this.mergeState(this.state, delta)
    }
  }

  // Update my own data
  updateMyData(delta) {
    if (this.myId) {
      this.sendDelta({ players: { [this.myId]: delta } })
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
