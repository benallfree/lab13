---
title: Evaluating Deltas
sidebar_position: 4
---

# Evaluating Deltas

Control which outgoing updates get sent. The `deltaEvaluator` lets you drop low‑value changes and prioritize important ones.

## What it is

`deltaEvaluator(delta, remoteState, myId) => boolean`

- `delta`: The pending, normalized changes that would be sent now
- `remoteState`: The last known remote state
- `myId`: Your player id (if assigned)

Return `true` to send this batch, `false` to skip it. Skipped batches are discarded.

## Quick start

```html
<script type="module">
  import Js13kClient from 'https://esm.sh/js13k-online'

  const client = new Js13kClient('my-room', {
    // Send only if movement is meaningful
    deltaEvaluator: (delta, remoteState, myId) => {
      const p = delta._players?.[myId]
      if (!p) return Object.keys(delta || {}).length > 0

      const before = remoteState._players?.[myId] || {}
      const dx = p.x == null ? 0 : Math.abs(p.x - (before.x || 0))
      const dy = p.y == null ? 0 : Math.abs(p.y - (before.y || 0))
      return dx > 4 || dy > 4
    },
  })
</script>
```

## Common patterns

```js
// 1) Always send critical events immediately
const client = new Js13kClient('fast-game', {
  deltaEvaluator: (delta, remoteState, myId) => {
    const mine = delta._players?.[myId]
    if (mine?.health !== undefined) return true // prioritize health
    return Object.keys(delta || {}).length > 0
  },
})

// 2) Distance threshold for positions
const client2 = new Js13kClient('threshold', {
  deltaEvaluator: (delta, remoteState, myId) => {
    const mine = delta._players?.[myId]
    if (!mine) return !!delta
    const prev = remoteState._players?.[myId] || {}
    const dx = mine.x == null ? 0 : Math.abs(mine.x - (prev.x || 0))
    const dy = mine.y == null ? 0 : Math.abs(mine.y - (prev.y || 0))
    return dx + dy > 6
  },
})

// 3) Combine with normalizeDelta for cleaner signals
const client3 = new Js13kClient('clean', {
  deltaNormalizer: (d) => ({
    ...d,
    _players: Object.fromEntries(
      Object.entries(d._players || {}).map(([id, p]) => [
        id,
        p == null ? null : { ...p, x: Math.round(p.x || 0), y: Math.round(p.y || 0) },
      ])
    ),
  }),
  deltaEvaluator: (delta) => Object.keys(delta || {}).length > 0,
})
```

## Tips

- Keep the check cheap; it runs each time a batch is about to be sent.
- Use `remoteState` to compare against the last sent state, not local state.
- Returning `false` drops this batch permanently; only choose it when that data truly isn’t needed.

See also: `ClientOptions.deltaNormalizer`, `ClientOptions.throttleMs`, and the tutorials on [Quantizing](./quantizing.mdx) and [Throttling](./throttling.md).
