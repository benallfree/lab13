---
sidebar_position: 5
---

# Going Further

Once you've mastered the basics, there are many advanced techniques and customizations available. This guide covers TypeScript integration, performance optimization, custom servers, and advanced patterns.

## TypeScript Integration

The SDK includes full TypeScript support with generic types for your game state:

### Basic TypeScript Usage

```typescript
// Define your game state type
interface MyGameState {
  players: Record<
    string,
    {
      x: number
      y: number
      name: string
      health: number
      inventory: string[]
    }
  >
  world: {
    items: Array<{
      id: number
      type: string
      x: number
      y: number
    }>
    score: number
  }
}

// Create a typed client
const client = new Js13kClient<MyGameState>('my-game')

// Now you get full type safety
client.on('state', (state) => {
  // state is typed as MyGameState
  state.players // ✅ Typed
  state.world.items // ✅ Typed
  state.invalidProperty // ❌ TypeScript error
})

// Type-safe state updates
client.updateMyState({
  x: 100,
  y: 200,
  invalidProperty: 'test', // ❌ TypeScript error
})
```

### Advanced Type Patterns

```typescript
// Extract player type for reuse
type Player = MyGameState['players'][string]

// Type-safe player state access
const myState: Player | null = client.getMyState()
const otherPlayer: Player | null = client.getPlayerState('other-id')

// Custom delta evaluator with types
const client = new Js13kClient<MyGameState>('my-game', {
  deltaEvaluator: (delta, shadowState, playerId) => {
    // All parameters are properly typed
    if (delta.players?.[playerId]?.x !== undefined) {
      // Type-safe access to delta properties
      return Math.abs(delta.players[playerId].x! - (shadowState.players?.[playerId]?.x || 0)) > 5
    }
    return true
  },
})
```

## Performance Optimization

### Fine-Tuned Throttling

Adjust throttling based on your game's needs:

```js
// High-frequency games (racing, action)
const client = new Js13kClient('fast-game', {
  throttleMs: 16, // ~60 FPS updates
})

// Turn-based games
const client = new Js13kClient('turn-based', {
  throttleMs: 500, // Updates every 500ms
})

// Variable throttling based on game state
const client = new Js13kClient('adaptive-game', {
  throttleMs: 50,
  deltaEvaluator: (delta, shadowState, playerId) => {
    // Send immediately for important events
    if (delta.players?.[playerId]?.health !== undefined) {
      return true // Health changes are critical
    }

    // Throttle position updates more aggressively when stationary
    if (delta.players?.[playerId]?.x !== undefined) {
      const player = shadowState.players?.[playerId]
      const speed = Math.abs(delta.players[playerId].x - (player?.x || 0))
      return speed > (player?.moving ? 2 : 10) // Different thresholds
    }

    return true
  },
})
```

### State Optimization Patterns

#### Spatial Partitioning

Only sync nearby players for large worlds:

```js
// Only update state for players within view distance
client.on('delta', (delta) => {
  if (delta.players) {
    const myState = client.getMyState()
    const viewDistance = 500

    Object.entries(delta.players).forEach(([playerId, playerDelta]) => {
      if (playerId === client.getMyId()) return // Always process self

      const distance = Math.sqrt(Math.pow(playerDelta.x - myState.x, 2) + Math.pow(playerDelta.y - myState.y, 2))

      if (distance <= viewDistance) {
        updatePlayerInUI(playerId, playerDelta)
      }
    })
  }
})
```

#### Interest Management

Only sync relevant state changes:

```js
// Track what each player is interested in
const interests = new Set(['combat', 'inventory']) // Player's current interests

client.on('delta', (delta) => {
  // Only process deltas relevant to current interests
  if (interests.has('combat') && delta.players) {
    // Process combat-related updates
    Object.entries(delta.players).forEach(([id, player]) => {
      if (player.health !== undefined || player.weapon !== undefined) {
        updateCombatUI(id, player)
      }
    })
  }

  if (interests.has('inventory') && delta.world?.items) {
    updateItemsUI(delta.world.items)
  }
})
```

## Advanced Client Patterns

### Connection Pooling

For games with multiple rooms or sessions:

```js
class GameManager {
  constructor() {
    this.clients = new Map()
  }

  joinRoom(roomId, gameType = 'default') {
    if (this.clients.has(roomId)) {
      return this.clients.get(roomId)
    }

    const client = new Js13kClient(`${gameType}-${roomId}`)
    this.clients.set(roomId, client)

    client.on('disconnected', () => {
      this.clients.delete(roomId)
    })

    return client
  }

  leaveRoom(roomId) {
    const client = this.clients.get(roomId)
    if (client) {
      client.disconnect()
      this.clients.delete(roomId)
    }
  }
}

const gameManager = new GameManager()
const lobbyClient = gameManager.joinRoom('lobby', 'chat')
const gameClient = gameManager.joinRoom('game-123', 'battle')
```

### State Synchronization Patterns

#### Master-Client Pattern

Designate one client as authoritative:

```js
class MasterClient {
  constructor(roomId) {
    this.client = new Js13kClient(roomId)
    this.isMaster = false
    this.players = new Set()

    this.client.on('connect', (playerId) => {
      this.players.add(playerId)
      this.checkMasterStatus()
    })

    this.client.on('disconnect', (playerId) => {
      this.players.delete(playerId)
      this.checkMasterStatus()
    })

    this.client.on('id', (myId) => {
      this.myId = myId
      this.checkMasterStatus()
    })
  }

  checkMasterStatus() {
    // Become master if you have the lowest ID (deterministic)
    const allPlayers = [...this.players, this.myId].filter(Boolean)
    const masterId = allPlayers.sort()[0]

    const wasMaster = this.isMaster
    this.isMaster = masterId === this.myId

    if (this.isMaster && !wasMaster) {
      console.log('🎮 Became game master')
      this.onBecomeMaster()
    } else if (!this.isMaster && wasMaster) {
      console.log('👥 No longer game master')
      this.onLoseMaster()
    }
  }

  onBecomeMaster() {
    // Start authoritative game logic
    this.gameLoop = setInterval(() => {
      this.updateGameWorld()
    }, 100)
  }

  onLoseMaster() {
    // Stop authoritative updates
    if (this.gameLoop) {
      clearInterval(this.gameLoop)
    }
  }

  updateGameWorld() {
    if (!this.isMaster) return

    // Update NPCs, world events, etc.
    this.client.updateState({
      world: {
        time: Date.now(),
        npcs: this.updateNPCs(),
        events: this.checkGameEvents(),
      },
    })
  }
}
```

## Running Your Own Server

For development or custom deployments, you can run the server locally:

### Local Development

```bash
# Clone the repository
git clone https://github.com/benallfree/js13k-partykit
cd js13k-partykit

# Install dependencies
bun install

# Start development server
bun run dev
```

### Custom Server Configuration

Modify the server behavior:

```typescript
// server/index.ts
export class CustomJs13kServer extends Js13kServer {
  onConnect(conn: Connection, ctx: ConnectionContext) {
    // Custom connection logic
    console.log('Custom connection handler')

    // Rate limiting
    if (this.getConnectedCount() > 100) {
      conn.close(1008, 'Server full')
      return
    }

    // Call parent implementation
    super.onConnect(conn, ctx)
  }

  onMessage(conn: Connection, message: WSMessage) {
    try {
      const data = JSON.parse(message.toString())

      // Custom validation
      if (data.delta && !this.validateDelta(data.delta, conn.id)) {
        console.warn('Invalid delta from', conn.id)
        return
      }

      super.onMessage(conn, message)
    } catch (error) {
      console.error('Message error:', error)
    }
  }

  validateDelta(delta: any, playerId: string): boolean {
    // Implement your validation logic
    if (delta.players?.[playerId]) {
      const playerDelta = delta.players[playerId]

      // Validate movement speed
      if (playerDelta.x !== undefined || playerDelta.y !== undefined) {
        // Check against previous position, time, etc.
        return this.validateMovement(playerDelta, playerId)
      }
    }

    return true
  }
}
```

## Testing and Debugging

### Debug Mode

Enable detailed logging:

```js
// Manual event logging
client.on('delta', (delta) => {
  console.log('🔄 Delta received:', JSON.stringify(delta, null, 2))
})

client.on('connected', () => {
  console.log('✅ Connected to server')
})

client.on('disconnected', () => {
  console.log('❌ Disconnected from server')
})
```

### Testing Utilities

```js
// Mock client for testing
class MockJs13kClient {
  constructor(roomId) {
    this.roomId = roomId
    this.state = { players: {} }
    this.eventListeners = {}
    this.myId = 'test-player-' + Math.random().toString(36).substr(2, 9)
  }

  // Implement same interface as real client
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event].push(callback)
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach((cb) => cb(data))
    }
  }

  // Simulate network events
  simulateConnect() {
    this.emit('connected')
    this.emit('id', this.myId)
    this.emit('state', this.state)
  }

  simulatePlayerJoin(playerId, playerState) {
    this.state.players[playerId] = playerState
    this.emit('connect', playerId)
    this.emit('delta', { players: { [playerId]: playerState } })
  }
}

// Use in tests
const mockClient = new MockJs13kClient('test-room')
mockClient.simulateConnect()
mockClient.simulatePlayerJoin('other-player', { x: 100, y: 200 })
```

## Performance Monitoring

Track client-side metrics:

```js
class PerformanceMonitor {
  constructor(client) {
    this.client = client
    this.metrics = {
      messagesReceived: 0,
      messagesSent: 0,
      averageLatency: 0,
      stateSize: 0,
    }

    this.setupMonitoring()
  }

  setupMonitoring() {
    // Track messages
    this.client.on('delta', () => {
      this.metrics.messagesReceived++
      this.metrics.stateSize = JSON.stringify(this.client.getState()).length
    })

    // Measure latency
    setInterval(() => {
      const start = performance.now()
      this.client.updateMyState({ _ping: start })
    }, 5000)

    this.client.on('delta', (delta) => {
      if (delta.players?.[this.client.getMyId()]?._ping) {
        const latency = performance.now() - delta.players[this.client.getMyId()]._ping
        this.metrics.averageLatency = (this.metrics.averageLatency + latency) / 2
      }
    })
  }

  getReport() {
    return {
      ...this.metrics,
      playersConnected: Object.keys(this.client.getState().players).length,
      connectionStatus: this.client.isConnected(),
    }
  }
}

const monitor = new PerformanceMonitor(client)
setInterval(() => {
  console.log('📊 Performance:', monitor.getReport())
}, 10000)
```

## What's Next?

You now have all the tools to build sophisticated multiplayer games! Some ideas to explore:

- **Real-time Strategy Games**: Use master-client pattern for game logic
- **MMORPGs**: Implement spatial partitioning for large worlds
- **Racing Games**: High-frequency updates with interpolation
- **Turn-based Games**: Consensus patterns for fair gameplay
- **Collaborative Tools**: Shared state for creative applications

The [JS13K MMO repository](https://github.com/benallfree/js13k-mmo) contains the complete source code and additional examples.

Happy coding, and may your games be epic! 🎮
