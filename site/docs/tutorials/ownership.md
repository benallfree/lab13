---
title: State Ownership
sidebar_position: 6
---

# State Ownership

## Overview

Some entities should be owned by exactly one client. The owner simulates and writes updates; everyone else renders them read‑only. There are two common approaches to state ownership:

- Sharded (client‑owned)
  - Pros: parallelizes simulation; scales with players; distributes work
  - Cons: items can orphan on disconnect unless adopted; motion pauses if owner lags

- Master client (authoritative)
  - Pros: no orphans; single source of truth; simpler consistency
  - Cons: single point of failure; requires smooth failover when master changes

## Client‑owned (sharded ownership)

### Marking ownership on spawn

Give each spawned item an `owner` set to your player id. In the Cats demo, a mouse is created with `owner: client.getMyId()`:

```327:343:site/static/games/cats/index.html
// Generate a new mouse
function spawnMouse() {
  const mouseId = generateUUID()
  const newMouse = {
    x: Math.random() * (canvas.width - 40) + 20,
    y: Math.random() * (canvas.height - 40) + 20,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    owner: client.getMyId(),
  }

  client.updateState({
    _mice: {
      [mouseId]: newMouse,
    },
  })
}
```

### Only the owner updates movement

Each client renders everything, but only moves items they own. Non‑owners do not mutate those items.

```345:376:site/static/games/cats/index.html
// Update mice positions (only for mice you own)
function updateMice() {
  const state = client.getState()
  if (!state._mice) return

  Object.entries(state._mice).forEach(([mouseId, mouse]) => {
    if (mouse.owner === client.getMyId()) {
      // Update position
      mouse.x += mouse.vx
      mouse.y += mouse.vy

      // Bounce off walls
      if (mouse.x < 10 || mouse.x > canvas.width - 10) {
        mouse.vx *= -1
      }
      if (mouse.y < 10 || mouse.y > canvas.height - 10) {
        mouse.vy *= -1
      }

      // Keep mice in bounds
      mouse.x = Math.max(10, Math.min(canvas.width - 10, mouse.x))
      mouse.y = Math.max(10, Math.min(canvas.height - 10, mouse.y))

      // Send updated position
      client.updateState({
        _mice: {
          [mouseId]: mouse,
        },
      })
    }
  })
}
```

### Disconnections and orphans

If an owner disconnects, their items become orphaned (the `owner` no longer exists in `state._players`). In the Cats demo, that’s acceptable: orphaned mice simply stop moving until they are caught.

For other games, you may want to automatically take ownership of orphans.

### Deterministic adoption pattern

Use a deterministic rule so all clients agree on who adopts a given orphan. One simple approach: pick a stable leader based on the orphan id.

```js
// Choose the adopter by hashing the item id into the sorted player list
function amDesignatedOwner(itemId, livePlayerIds, myId) {
  if (livePlayerIds.length === 0) return false
  const sorted = [...livePlayerIds].sort()
  const h = simpleHash(itemId)
  const idx = h % sorted.length
  return sorted[idx] === myId
}

function simpleHash(str) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Run on an interval or in response to 'delta' events
function adoptOrphans() {
  const state = client.getState()
  const livePlayerIds = Object.keys(state._players || {})
  const myId = client.getMyId()

  Object.entries(state._mice || {}).forEach(([mouseId, mouse]) => {
    const ownerAlive = mouse.owner && state._players?.[mouse.owner] != null
    if (!ownerAlive && amDesignatedOwner(mouseId, livePlayerIds, myId)) {
      // Adopt by setting owner to me; keep other fields unchanged
      client.updateState({ _mice: { [mouseId]: { ...mouse, owner: myId } } })
    }
  })
}
```

Notes:

- The rule must be the same on every client to avoid tug‑of‑war.
- Consider adding a small delay before adopting to let recently reconnected owners resume control.
- If items should despawn instead of being adopted, delete them when orphaned or after a timeout.

## Master‑Client (authoritative)

Instead of sharding ownership across many players, you can designate a single client as the authoritative "master" that updates shared items for everyone. This eliminates orphans because the master continues updating all items regardless of who spawned them.

Key idea: elect a master deterministically (e.g., lowest player id). Only the master mutates shared state; others render read‑only.

```js
class MasterClient {
  constructor(roomId) {
    this.client = new Js13kClient(roomId)
    this.isMaster = false
    this.masterId = undefined
    this.connectedPlayers = new Set()

    this.client.on('connect', (playerId) => {
      this.connectedPlayers.add(playerId)
      this.recomputeMaster()
    })
    this.client.on('disconnect', (playerId) => {
      this.connectedPlayers.delete(playerId)
      this.recomputeMaster() // promotes next leader if the master left
    })
    this.client.on('id', (myId) => {
      this.myId = myId
      this.recomputeMaster()
    })
  }

  recomputeMaster() {
    const all = [...this.connectedPlayers, this.myId].filter(Boolean).sort()
    const leader = all[0]
    const previousMasterId = this.masterId
    this.masterId = leader

    const wasMaster = this.isMaster
    this.isMaster = this.myId === this.masterId

    const promotionHappened = previousMasterId && previousMasterId !== this.masterId
    if (promotionHappened) {
      // Optional: migrate timers, adopt orphans, etc.
    }

    if (this.isMaster && !wasMaster) this.onBecomeMaster(previousMasterId)
    else if (!this.isMaster && wasMaster) this.onLoseMaster(this.masterId)
  }

  onBecomeMaster(previousMasterId) {
    this.loop = setInterval(() => {
      // Example: advance NPCs, migrate or adopt orphaned items, etc.
      this.updateWorld()
    }, 100)
  }

  onLoseMaster(nextMasterId) {
    if (this.loop) clearInterval(this.loop)
  }

  updateWorld() {
    if (!this.isMaster) return
    // Perform authoritative updates here
    // this.client.updateState({ world: { /* ... */ } })
  }
}
```

### Promotion (failover)

Promotion occurs automatically when the current master disconnects or when a new lower‑id client joins:

- Maintain `masterId` based on a deterministic rule (e.g., lowest player id).
- Recompute on `connect`, `disconnect`, and when you receive your own `id`.
- When `masterId` changes, the newly elected master starts the authoritative loop.

```js
// Any client can run this; only the elected master will keep the loop running
client.on('disconnect', () => master.recomputeMaster())
client.on('connect', () => master.recomputeMaster())
client.on('id', () => master.recomputeMaster())
```

## Best practices

- Represent ownership explicitly (e.g., `owner: playerId`).
- Only the owner mutates owned items; everyone else treats them as read‑only.
- Handle disconnections: either accept orphans (like Cats) or adopt them deterministically.
- Combine with throttling/quantization/evaluation to reduce network noise:
  - `deltaNormalizer` to snap movement
  - `deltaEvaluator` to skip low‑value updates
  - `throttleMs` to batch frequent changes

## See also

- [Understanding Game State](./game-state.md)
- [Quantizing Deltas](./quantizing.mdx)
- [Throttling Updates](./throttling.md)
- [Evaluating Deltas](./delta-evaluator.md)
