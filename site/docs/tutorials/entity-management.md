---
title: Managing Entities and Collections
sidebar_position: 10
---

# Managing Entities and Collections

JS13K Online distinguishes between regular collections and entity collections. Understanding the difference helps you avoid race conditions and design predictable state updates.

## Two kinds of collections

- **Non‑entity collections**: Normal arrays/objects like `mice`, `items`, or `world.towers`. You can structure them however you want. Deletions are conventional (e.g., remove from array or omit a key in an object). These do not get tombstones; subsequent writes to removed IDs are allowed unless your game enforces otherwise.

- **Entity collections (underscore‑prefixed)**: Any object key that starts with `_` (e.g., `_mice`, `_bullets`, `_players`) is treated as an entity collection. Keys are presumed to be GUIDs (use `generateUUID()`). Deleting an entity is done by setting its entry to `null`, which tombstones the GUID so future updates for that GUID are ignored by client and server.

Why underscore? It signals “this object holds entities with strong deletion semantics.” The framework relies on this to provide tombstones and eliminate race conditions around deletion.

## When to use each

- **Use non‑entity collections** when:
  - You do not need strong deletion guarantees
  - Data is ephemeral or easily recomputed
  - You manage conflicts at the application level

- **Use entity collections** when:
  - Items have a lifecycle and identity (spawn → update → delete)
  - You need hard guarantees that deleted entities cannot be resurrected by late/duplicated packets
  - Many clients may concurrently touch the same set of entities

## Creating GUID‑keyed entities

```js
import Js13kClient, { generateUUID } from 'https://esm.sh/js13k-online'

// Create a new mouse entity in an entity collection
const mouseId = generateUUID()
client.updateState({
  _mice: {
    [mouseId]: { x: 100, y: 150, owner: client.getMyId() },
  },
})

// Update it later
client.updateState({ _mice: { [mouseId]: { x: 120 } } })

// Delete via tombstone (null) — further updates for mouseId will be dropped
client.updateState({ _mice: { [mouseId]: null } })
```

Behind the scenes, the SDK/server will:

- Treat any object key starting with `_` as an entity collection
- Record tombstoned GUIDs and ignore subsequent updates to them
- Merge non‑null updates normally across clients

This is a key feature of the framework to prevent race conditions on deleted entities.

## Built‑in `_players` collection

- `_players` is a built‑in entity collection keyed by socket connection IDs (treated as GUIDs)
- The server creates `_players[conn.id] = {}` on connect and removes it on disconnect
- Use `client.updateMyState(...)` as a convenience for `client.updateState({ _players: { [myId]: delta } })`

Example:

```js
// Update my player state
client.updateMyState({ x: 300, y: 240, name: 'Player' })

// Remove another entity collection entry you own (game‑specific rules)
client.updateState({ _mice: { [someMouseId]: null } })
```

## Choosing a structure

- Prefer entity collections for objects with identity and lifecycle
- Prefer non‑entity collections for derived/aggregate data or where deletion races are not a concern

Tip: Keep entity payloads small and focused on network‑relevant fields. Use local‑only data for visuals or effects to reduce network noise.
