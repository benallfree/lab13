---
title: Throttling Updates
sidebar_position: 3
---

# Throttling Updates

Adjust throttling based on your game's needs to balance responsiveness and bandwidth.

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
  // Normalize ("normalizeDelta") before evaluation
  deltaNormalizer: (delta) => ({
    ...delta,
    _players: Object.fromEntries(
      Object.entries(delta._players || {}).map(([id, p]) => [
        id,
        p == null ? null : { ...p, x: Math.round(p.x || 0), y: Math.round(p.y || 0) },
      ])
    ),
  }),
  deltaEvaluator: (delta, remoteState, playerId) => {
    // Send immediately for important events
    if (delta._players?.[playerId]?.health !== undefined) {
      return true // Health changes are critical
    }

    // Throttle position updates more aggressively when stationary
    if (delta._players?.[playerId]?.x !== undefined) {
      const player = remoteState._players?.[playerId]
      const speed = Math.abs(delta._players[playerId].x - (player?.x || 0))
      return speed > (player?.moving ? 2 : 10) // Different thresholds
    }

    return true
  },
})
```

See also: `ClientOptions.throttleMs`, `ClientOptions.deltaNormalizer`, and `ClientOptions.deltaEvaluator` in the API reference.
