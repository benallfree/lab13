---
title: Spatial Partitioning
sidebar_position: 5
---

# Spatial Partitioning

Only sync nearby players for large worlds to reduce bandwidth and client work.

```js
// Only update state for players within view distance
client.on('state-updated', (event) => {
  const { delta } = event.detail
  if (delta._players) {
    const myState = client.state()._players[client.playerId()]
    const viewDistance = 500

    Object.entries(delta._players).forEach(([playerId, playerDelta]) => {
      if (playerId === client.playerId()) return // Always process self

      const distance = Math.sqrt(Math.pow(playerDelta.x - myState.x, 2) + Math.pow(playerDelta.y - myState.y, 2))

      if (distance <= viewDistance) {
        updatePlayerInUI(playerId, playerDelta)
      }
    })
  }
})
```
