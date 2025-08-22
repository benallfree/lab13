---
title: Throttling Updates
sidebar_position: 3
---

# Throttling Updates

Adjust throttling based on your game's needs to balance responsiveness and bandwidth.

```js
// Manual throttling for high-frequency games (racing, action)
let lastUpdateTime = 0
const FAST_THROTTLE = 16 // ~60 FPS updates

function updatePlayerPosition(x, y) {
  const now = Date.now()
  if (now - lastUpdateTime < FAST_THROTTLE) {
    return // Skip update if too soon
  }

  client.mutateState({
    _players: {
      [client.playerId()]: { x, y },
    },
  })
  lastUpdateTime = now
}

// Manual throttling for turn-based games
let lastTurnUpdate = 0
const TURN_THROTTLE = 500 // Updates every 500ms

function submitTurn(turnData) {
  const now = Date.now()
  if (now - lastTurnUpdate < TURN_THROTTLE) {
    return // Skip update if too soon
  }

  client.mutateState({
    gameState: { currentTurn: turnData },
  })
  lastTurnUpdate = now
}

// Adaptive throttling based on game state
function adaptiveUpdate(delta, currentState, myId) {
  const now = Date.now()

  // Send immediately for important events
  if (delta._players?.[myId]?.health !== undefined) {
    client.mutateState(delta)
    return
  }

  // Throttle position updates more aggressively when stationary
  if (delta._players?.[myId]?.x !== undefined) {
    const player = currentState._players?.[myId]
    const speed = Math.abs(delta._players[myId].x - (player?.x || 0))
    const threshold = player?.moving ? 2 : 10

    if (speed > threshold) {
      client.mutateState(delta)
    }
    return
  }

  // Default: send the update
  client.mutateState(delta)
}
```

See also: the tutorials on [Delta Evaluation](./delta-evaluator.md) and [Performance Monitoring](./performance-monitoring.md).
