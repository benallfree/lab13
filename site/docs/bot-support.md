---
title: Bot Support
sidebar_position: 7
---

# Bot Support

Lab 13 provides built-in support for bots in multiplayer games. Bots are treated separately from real players and can be used for monitoring and analytics purposes.

> **Important**: Per JS13K Online competition rules, bots cannot interact with or alter game state. They can only monitor and observe the game.

## Creating a Bot

To create a bot, pass the `bot: true` option when initializing the Lab13Client:

```js
import { Lab13Client } from 'https://esm.sh/lab13-sdk'
import { PartySocket } from 'https://esm.sh/partysocket'

const socket = new PartySocket({
  host: 'your-party-server.partykit.dev',
  room: 'my-game-room',
})

// Create a bot client (monitoring only)
const botClient = Lab13Client(socket, { bot: true })
```

## Bot Behavior

When a client connects with `bot: true`:

1. **Automatic Announcement**: The bot automatically announces itself to other clients using the `b` message
2. **Separate Tracking**: Bots are tracked separately from real players
3. **Event System**: Bot-specific events are dispatched for connection/disconnection
4. **Monitoring Only**: Bots cannot send game state updates or interact with the game

## Bot Events

Bots trigger special events that are separate from player events:

```js
// Bot list updated
client.on('bot-ids-updated', (event) => {
  const botIds = event.detail
  console.log('Current bots:', botIds)
})

// Client connected (includes bots)
client.on('client-connected', (event) => {
  const clientId = event.detail
  console.log('Client connected:', clientId)
})

// Client disconnected (includes bots)
client.on('client-disconnected', (event) => {
  const clientId = event.detail
  console.log('Client disconnected:', clientId)
})
```

## API Methods

The Lab13Client provides methods to access bot information:

```js
// Get all bot IDs
const botIds = client.botIds()
console.log('Bots:', botIds)

// Get all player IDs (excluding bots)
const playerIds = client.playerIds()
console.log('Real players:', playerIds)

// Get all client IDs (players + bots)
const allClients = client.clientIds()
console.log('All participants:', allClients)

// Check your client type
const myType = client.clientType()
console.log('I am a:', myType) // 'player' or 'bot'
```

## Example: Monitoring Bot

Here's an example of a bot that monitors game activity:

```js
import { Lab13Client } from 'lab13-sdk'
import { PartySocket } from 'https://esm.sh/partysocket'

const socket = new PartySocket({
  host: 'relay.js13kgames.com',
  room: 'game-monitor',
})

const bot = Lab13Client(socket, { bot: true })

// Bot monitoring state
let gameStats = {
  playersConnected: 0,
  messagesReceived: 0,
  gameStartTime: Date.now(),
}

// When bot gets its ID, start monitoring
bot.on('player-id-updated', (event) => {
  const botId = event.detail
  console.log('Monitor bot ID assigned:', botId)

  // Start monitoring
  setInterval(() => {
    const stats = {
      timestamp: Date.now(),
      uptime: Date.now() - gameStats.gameStartTime,
      players: bot.playerIds().length,
      bots: bot.botIds().length,
      totalClients: bot.clientIds().length,
      messagesReceived: gameStats.messagesReceived,
    }

    console.log('Game Stats:', stats)
    // Could send stats to analytics service
  }, 5000)
})

// Listen for game activity (monitoring only)
bot.on('message', (event) => {
  gameStats.messagesReceived++

  try {
    const data = JSON.parse(event.data)
    if (data.type === 'move') {
      console.log('Player moved:', data.playerId, data.x, data.y)
    } else if (data.type === 'chat') {
      console.log('Chat message:', data.from, data.text)
    }
  } catch (e) {
    // Ignore non-JSON messages
  }
})

// Track client connections
bot.on('client-connected', (event) => {
  console.log('Client joined:', event.detail)
  gameStats.playersConnected = bot.clientIds().length
})

bot.on('client-disconnected', (event) => {
  console.log('Client left:', event.detail)
  gameStats.playersConnected = bot.clientIds().length
})
```

## Bot vs Player Separation

The key benefit of bot support is that bots are completely separated from real players:

- **Client Events**: Triggered by all clients (players and bots)
- **Player Events**: Only triggered by real human players
- **Bot Events**: Only triggered by bot clients
- **Separate Lists**: `playerIds()` and `botIds()` return different sets
- **Clean Tracking**: Bots don't interfere with player management
- **Monitoring Only**: Bots cannot alter game state

This separation allows you to:

- Create monitoring and analytics bots
- Track game statistics without affecting gameplay
- Maintain clean player lists for scoring/leaderboards
- Create spectator bots that observe but don't participate

## Event Flow

The bot support follows this event flow:

1. **Client Connects** (`+` event): Client is added to `clientIds` and assumed to be a player
2. **Bot Announces** (`b` event): If it's a bot, it's moved from `playerIds` to `botIds`
3. **Client Disconnects** (`-` event): Client is removed from all sets

This approach ensures that:

- All clients are tracked in `clientIds`
- Bots are properly separated from players
- Events are dispatched appropriately for each client type

## Best Practices

1. **Monitoring Only**: Bots should only observe, never interact with game state
2. **Clear Bot Identification**: Use the bot events to clearly identify bot behavior
3. **Separate Logic**: Handle bot and player events separately
4. **Bot Limits**: Consider implementing limits on the number of bots per room
5. **Error Handling**: Bots should handle disconnections gracefully
6. **Client Type Checking**: Use `clientType()` to determine your role
7. **Analytics Focus**: Use bots for gathering game statistics and monitoring

## Protocol Details

The bot support uses these message types:

- `b<botId>`: Bot announcement (sent when bot connects)
- `.i<clientId>|b`: Player ID response with bot marker

These messages are automatically handled by the Lab13Client and server, so you don't need to implement the protocol manually.

## Integration with Game Logic

```js
// Handle different client types
client.on('client-connected', (event) => {
  const clientId = event.detail

  // Check if it's a bot
  if (client.botIds().includes(clientId)) {
    console.log('Monitor bot joined:', clientId)
    // Handle bot-specific logic (monitoring only)
  } else {
    console.log('Player joined:', clientId)
    // Handle player-specific logic
    createPlayerUI(clientId)
  }
})

// Track bot presence for analytics
client.on('bot-ids-updated', (event) => {
  const bots = event.detail
  console.log('Active monitor bots:', bots)

  // Update analytics systems
  updateAnalytics(bots)
})
```

## Competition Rules Compliance

Remember that for JS13K Online:

- **Bots cannot interact with game state** - they can only monitor
- **All game logic must run on client side** - bots are clients too
- **Server acts as relay only** - no server-side game logic allowed
- **Bots are for monitoring/analytics only** - not for gameplay interaction
