# Reference

Unofficial client SDK for the [JS13K Online](https://online.js13kgames.com) challenge.

## Why Use Lab13 SDK?

The Lab13 SDK extends the base JS13K Online protocol with additional conveniences that make multiplayer game development easier:

- **Automatic Player Tracking**: No need to manually query for connected players
- **Enhanced Events**: Rich event system for player management with proper TypeScript support
- **Bot Support**: Built-in support for monitoring and analytics bots
- **Protocol Extensions**: Additional message types for common multiplayer scenarios
- **Type Safety**: Full TypeScript support with proper event typing
- **Convenience Methods**: Higher-level APIs for common multiplayer patterns
- **State Management**: Built-in state synchronization with deep merging and delta updates

While you can use the raw JS13K Online protocol directly, the Lab13 SDK handles the complexity of player ID management and connection tracking for you.

## Installation

```bash
npm i lab13-sdk
```

> Note: the Lab13 Client SDK must be bundled with your 13kb game. It is not a free resource.

## Quick Start

```html
<script type="module">
  import { Lab13Client } from 'https://esm.sh/lab13-sdk'
  import { PartySocket } from 'https://esm.sh/partysocket'

  const socket = new PartySocket({
    host: 'your-party-server.partykit.dev',
    room: 'my-game-room',
  })

  const client = Lab13Client(socket)

  client.on('player-id-updated', (event) => {
    console.log('My ID:', event.detail)
  })

  client.on('client-connected', (event) => {
    console.log('Client joined:', event.detail)
  })

  client.on('client-disconnected', (event) => {
    console.log('Client left:', event.detail)
  })

  // State management
  client.on('state-updated', (event) => {
    console.log('State updated:', event.detail.state)
    console.log('Delta received:', event.detail.delta)
  })

  // Generate unique IDs for game entities
  const entityId = client.generateId() // e.g., "k7m9n2p4q5r6s8t9"
</script>
```

## Bot Support

Create monitoring bots with built-in bot support:

```js
// Create a monitoring bot client
const botClient = Lab13Client(socket, { bot: true })

// Listen for bot-specific events
client.on('bot-ids-updated', (event) => {
  console.log('Current monitor bots:', event.detail)
})
```

> **Note**: Per JS13K Online rules, bots can only monitor the game. They cannot interact with or alter game state.

## State Management

The SDK provides built-in state synchronization with automatic deep merging:

```js
// Get current state
const currentState = client.state()

// Update state (automatically syncs to all clients)
client.mutateState({
  players: {
    [playerId]: {
      position: { x: 100, y: 200 },
      health: 100,
    },
  },
})

// Listen for state updates
client.on('state-updated', (event) => {
  const { state, delta } = event.detail
  // Handle state changes
  updateGameDisplay(state)
})
```

### State Protocol

The SDK implements a state synchronization protocol:

- **`?s<replyId>`**: Request full state from a specific client
- **`.s<json>`**: Response with full state data
- **`d<json>`**: Delta update to merge into current state

## API Reference

### Core Methods

- `playerId()` - Get your current player ID
- `clientIds()` - Get array of all connected client IDs
- `playerIds()` - Get array of all connected player IDs (excluding bots)
- `botIds()` - Get array of all connected bot IDs
- `clientType()` - Get your client type ('player' or 'bot')
- `queryPlayerIds()` - Request updated player list from server
- `generateId()` - Generate a compact 16-character unique ID

### Communication Methods

- `sendToPlayer(playerId, message)` - Send message to specific player
- `sendToAll(message)` - Broadcast message to all players

### State Management Methods

- `state()` - Get current state object
- `mutateState(delta)` - Update state and sync to all clients

### Event Handling

- `on(event, callback)` - Listen for events
- `off(event, callback)` - Remove event listener

### Events

- `player-id-updated` - Your player ID was assigned/updated
- `client-connected` - New client joined (player or bot)
- `client-disconnected` - Client left (player or bot)
- `client-ids-updated` - Complete client list changed
- `player-ids-updated` - Player list changed (excluding bots)
- `bot-ids-updated` - Bot list changed
- `state-updated` - State was updated (includes current state and delta)

## Protocol Extensions

Lab13 extends the base JS13K Online protocol with:

1. **Player ID Queries** (`?i` messages) - Automatically track connected players
2. **Bot Support** (`b` messages) - Separate bot tracking for monitoring
3. **State Management** (`?s`, `.s`, `d` messages) - State synchronization with deep merging
4. **Enhanced Events** - Rich event system for player and bot management
5. **Type Safety** - Full TypeScript support with proper event typing
6. **Convenience Methods** - Higher-level APIs for common multiplayer patterns

The base protocol provides the core communication primitives, while Lab13 adds the conveniences that make multiplayer game development easier.

📖 [Tutorials](https://lab13.benallfree.com/docs)

🕹️ [Play the games](https://lab13.benallfree.com/lobby)

## License

MIT
