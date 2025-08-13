# JS13K MMO Implementation Guide

Build multiplayer games for JS13K using the [partysocket](https://github.com/partykit/partysocket) library.

## Quick Start

- **Server**: `https://mmo.js13kgames.com`
- **Library**: partysocket (FREE - doesn't count against 13KB limit)
- **Room**: Use unique room names for your game

## How It Works

This is a **state relay server** for tiny multiplayer games. There's no game logic on the server - it simply forwards state changes between clients.

### Key Concepts

- Each client maintains the **full game state** locally
- Clients send **deltas** (state changes) to the server
- Server broadcasts deltas to all other clients
- Clients merge deltas to stay synchronized
- All clients are **trusted** (no validation or anti-cheat)

### Your Responsibilities

- Define your game state structure
- Handle player input and game logic
- Send appropriate deltas when state changes
- Merge incoming deltas from other players
- Clean up when players disconnect

## Basic Setup

```javascript
import PartySocket from "https://esm.sh/partysocket";

const socket = new PartySocket({
  host: "mmo.js13kgames.com",
  party: "js13k",
  room: "my-unique-game-name", // Must be unique to your game
});
```

## Message Types

The server sends 5 types of messages:

### `id` - Your Player ID

```javascript
{
  id: "unique-connection-id";
}
```

Sent first when you connect. Use this ID to identify your data in the game state.

### `state` - Full Game State

```javascript
{
  state: {
    /* all player data */
  }
}
```

Sent after your ID. Contains current state of all connected players.

### `delta` - State Changes

```javascript
{ delta: { "player-id": { /* changed data */ } } }
```

Sent when any player updates their state. Merge this into your local state.

### `connect` - Player Joined

```javascript
{
  connect: "new-player-id";
}
```

Someone new joined. They'll send their initial state via delta.

### `disconnect` - Player Left

```javascript
{
  disconnect: "player-id";
}
```

Someone left. Remove their data from your local state.

## Implementation

### State Merging

Use this exact merge function (same as the server):

```javascript
function mergeState(target, source) {
  if (typeof source !== "object" || source === null) {
    return source;
  }
  if (typeof target !== "object" || target === null) {
    target = {};
  }
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      target[key] = mergeState(target[key], source[key]);
    }
  }
  return target;
}
```

### Message Handling

```javascript
let localState = {};
let myId = null;

socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  if (data.id) {
    myId = data.id;
    // Initialize your player data
    if (!localState[myId]) {
      localState[myId] = { x: 100, y: 100 }; // Your game data
      socket.send(JSON.stringify({ delta: { [myId]: localState[myId] } }));
    }
  } else if (data.state) {
    localState = data.state;
    render();
  } else if (data.delta) {
    localState = mergeState(localState, data.delta);
    render();
  } else if (data.disconnect) {
    delete localState[data.disconnect];
    render();
  }
});
```

### Sending Updates

```javascript
function updatePlayer(newData) {
  localState[myId] = { ...localState[myId], ...newData };
  socket.send(JSON.stringify({ delta: { [myId]: localState[myId] } }));
  render(); // Immediate feedback
}
```

#### State Management Strategies

The room state can contain both player-specific data and shared game state without conflicts:

```javascript
{
  // Player-specific state (using connection IDs as keys)
  "conn-123": { x: 100, y: 50, health: 80 },
  "conn-456": { x: 200, y: 150, health: 100 },

  // Shared game state (non-connection-ID keys)
  "gameMode": "battle",
  "round": 3,
  "powerups": [{ x: 300, y: 200, type: "speed" }]
}
```

**Automatic Player Cleanup**: When a player disconnects, the server checks if the state root contains a key matching their connection ID. If found, that player's state is automatically removed. Shared state keys (like `gameMode`, `round`, etc.) are never affected because connection IDs are guaranteed to be unique and won't collide with your chosen shared state keys.

This design allows you to:

- Store per-player data using connection IDs as root keys
- Maintain shared game state alongside player data
- Rely on automatic cleanup for disconnected players
- Avoid naming conflicts between player and shared state

## Game Examples

**Paint Demo** - Collaborative pixel art

- State: `{ x: { y: color } }` (pixel positions)
- Players draw pixels, all clients see updates instantly

**Cars Demo** - Multiplayer racing

- State: `{ playerId: { x, y, angle } }` (car positions)
- Players drive cars, movement synced across clients

**Flight Simulator** - 3D multiplayer flight

- State: `{ playerId: { x, y, z, rx, ry, rz, s } }` (aircraft position, rotation, speed)
- Players fly aircraft in 3D space with realistic physics and controls

## Best Practices

- **Render after every state change** - Keep display synchronized
- **Use requestAnimationFrame** - Smooth 60fps updates
- **Show connection status** - Visual feedback for users
- **Only send what changed** - Minimize network traffic
- **Clean up disconnects** - Remove players immediately

## Error Handling

```javascript
socket.addEventListener("error", (error) => {
  console.error("Connection error:", error);
});

socket.addEventListener("close", () => {
  // Handle reconnection or show offline state
});
```
