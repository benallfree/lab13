---
title: Custom Events and Message Keys
sidebar_position: 9
---

# Custom Events and Message Keys

The SDK and server recognize a small set of standard message keys and forward everything else verbatim. This lets you keep state updates in deltas while also broadcasting ad‑hoc events (chat, emotes, triggers, RPC‑style pings) as custom keys.

## Standard keys

- **player-id-updated**: Your connection id. Emitted once on connect via `client.on('player-id-updated', (event) => ...)`.
- **state-updated**: State updates from other clients. `client.on('state-updated', (event) => ...)`.
- **client-connected**: Another client connected. `client.on('client-connected', (event) => ...)`.
- **client-disconnected**: A client disconnected. `client.on('client-disconnected', (event) => ...)`.
- **client-ids-updated**: List of all connected clients updated. `client.on('client-ids-updated', (event) => ...)`.
- **player-ids-updated**: List of all connected players updated. `client.on('player-ids-updated', (event) => ...)`.
- **bot-ids-updated**: List of all connected bots updated. `client.on('bot-ids-updated', (event) => ...)`.

Any other top‑level keys are treated as custom events and are forwarded untouched to all clients and emitted by the SDK using the same key name.

## When to use deltas vs custom events

- **Deltas** (`client.mutateState(...)`): For shared, durable game state that should be merged and reflected in everyone's `client.state()`.
- **Custom events** (`ws.send({ someKey: ... })`): For ephemeral signals that don't belong in shared state (e.g., chat messages, sound triggers, one‑shot actions, pings).

## Receiving custom events

Just subscribe to the key you send:

```js
client.on('chat', ({ text, from }) => {
  renderChat(from, text)
})

client.on('emote', ({ type, playerId }) => {
  playEmote(type, playerId)
})
```

## Sending custom events

The server will broadcast any JSON message that doesn’t contain a `delta` field to other clients as‑is. The SDK forwards unknown keys as events. You can send a custom event by writing a JSON object with your key at the top level.

Because the SDK focuses its public API on state (deltas), use the underlying WebSocket as an escape hatch:

```js
// Send a chat message to all other clients
const ws = client.socket // access the underlying WebSocket
ws?.send(JSON.stringify({ chat: { text: 'Hello!', from: client.playerId() } }))

// Trigger a custom emote
ws?.send(JSON.stringify({ emote: { type: 'wave', playerId: client.playerId() } }))
```

Notes:

- The server logs and rebroadcasts unknown messages: `{ yourKey: yourPayload }`.
- The SDK will emit `client.on('yourKey', (payload) => ...)` on every recipient.
- Keep payloads small and avoid sensitive data; unknown keys are relayed verbatim.

## Custom keys inside deltas

If your custom data should persist in shared state, include it in a delta instead of a custom event:

```js
// Persist weather in shared world state
client.mutateState({ world: { weather: 'rain' } })

// Everyone receives it in the next state-updated event
client.on('state-updated', (event) => {
  const { delta } = event.detail
  if (delta.world?.weather) applyWeather(delta.world.weather)
})
```

Tip: underscore‑prefixed objects (e.g., `_players`, `_mice`) are treated as entity collections with tombstones. Regular keys (like `world`, `settings`, `chatHistory`) are merged normally.
