---
title: Evaluating Deltas
sidebar_position: 4
---

# Evaluating Deltas

Control which outgoing updates get sent. The `deltaEvaluator` lets you drop low‑value changes and prioritize important ones.

## What it is

The Lab 13 SDK doesn't currently support built-in delta evaluation. Instead, you can implement your own evaluation logic before calling `mutateState()`.

You can create your own `deltaEvaluator(delta, currentState, myId) => boolean` function:

- `delta`: The pending changes you want to send
- `currentState`: The current game state
- `myId`: Your player id (if assigned)

Return `true` to send this batch, `false` to skip it.

## Quick start

```js
import { Lab13Client } from 'https://esm.sh/js13k'

// Custom delta evaluator function
function deltaEvaluator(delta, currentState, myId) {
  const p = delta._players?.[myId]
  if (!p) return Object.keys(delta || {}).length > 0

  const before = currentState._players?.[myId] || {}
  const dx = p.x == null ? 0 : Math.abs(p.x - (before.x || 0))
  const dy = p.y == null ? 0 : Math.abs(p.y - (before.y || 0))
  return dx > 4 || dy > 4
}

// Use in your update logic
function updatePlayerPosition(x, y) {
  const delta = {
    _players: {
      [client.playerId()]: { x, y },
    },
  }

  if (deltaEvaluator(delta, client.state(), client.playerId())) {
    client.mutateState(delta)
  }
}
```

## Common patterns

```js
// 1) Always send critical events immediately
function deltaEvaluator(delta, currentState, myId) {
  const mine = delta._players?.[myId]
  if (mine?.health !== undefined) return true // prioritize health
  return Object.keys(delta || {}).length > 0
}

// 2) Distance threshold for positions
function deltaEvaluator(delta, currentState, myId) {
  const mine = delta._players?.[myId]
  if (!mine) return !!delta
  const prev = currentState._players?.[myId] || {}
  const dx = mine.x == null ? 0 : Math.abs(mine.x - (prev.x || 0))
  const dy = mine.y == null ? 0 : Math.abs(mine.y - (prev.y || 0))
  return dx + dy > 6
}

// 3) Combine with normalization for cleaner signals
function normalizeAndEvaluate(delta, currentState, myId) {
  // Normalize positions
  if (delta._players) {
    Object.values(delta._players).forEach((player) => {
      if (player && typeof player === 'object') {
        if (player.x !== undefined) player.x = Math.round(player.x)
        if (player.y !== undefined) player.y = Math.round(player.y)
      }
    })
  }

  return Object.keys(delta || {}).length > 0
}
```

## Tips

- Keep the check cheap; it runs each time you want to send an update.
- Use `currentState` to compare against the current state, not local state.
- Returning `false` skips this update; only choose it when that data truly isn't needed.
- Consider implementing your own throttling mechanism to prevent too frequent updates.

See also: the tutorials on [Quantizing](./quantizing.mdx) and [Throttling](./throttling.md).
