/// <reference types="lab13-sdk/W" />

import {
  StateBase,
  useDemo,
  useEasyState,
  useKeyboard,
  useMyId,
  useOnline,
  usePointerLock,
  useResizer,
  useSpeedThrottledRaf,
} from 'lab13-sdk'
import { createWorld } from './createWorld'
import { lion } from './lion'

export type PlayerState = { x: number; z: number; ry: number; b: string; v: boolean }

export type GameState = StateBase<PlayerState>

function main() {
  useOnline(`mewsterpiece/gotron`)
  const { getMyId } = useMyId()
  const { updateMyState, getMyState, getPlayerStates, getPlayerState } = useEasyState<GameState>({
    positionPrecision: 2,
    rotationPrecision: 2,
    rotationUnits: 'd',
    onPlayerStateAvailable: (id, state) => spawnPlayer(id, state),
    debug: true,
  })
  useResizer()

  const ME = getMyId()

  const PLAYER_COLORS = ['#f00', '#00f', '#ff0', '#0f0', '#000'] // red, blue, yellow, green,  black

  const spawnMe = () => {
    const r = 10 * Math.sqrt(Math.random()),
      a = Math.random() * Math.PI * 2
    // Create a cube sitting in the middle of the plane
    const props: PlayerState = {
      x: Math.cos(a) * r,
      z: Math.sin(a) * r,
      ry: (Math.atan2(Math.cos(a) * r, Math.sin(a) * r) * 180) / Math.PI,
      b: PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)],
      v: false,
    }
    lion(ME, props)

    W.camera({ g: ME, x: 0, y: 1.5, z: 2.5 })
    updateMyState(props)
  }

  const spawnPlayer = (id: string, state: PlayerState) => {
    console.log('spawnPlayer', id)
    lion(id, state)
  }

  createWorld()

  // Create another cube for reference
  const refCubeProps = { x: 0, y: 0.5, w: 0.5, h: 100, d: 0.5, b: '0f0' }
  W.cube({ n: 'refCube', ...refCubeProps })
  const updateRefCube = (speed: number) => {
    // Morph refCube's color over time
    const t = performance.now() * 0.001
    // Use HSL for full color wheel, keep lightness high
    const h = (t * 60) % 360
    const s = 100
    const l = 60 + 20 * Math.sin(t * 0.7) // never too dark
    // Convert HSL to RGB
    function hsl2rgb(h: number, s: number, l: number) {
      s /= 100
      l /= 100
      const k = (n: number) => (n + h / 30) % 12
      const a = s * Math.min(l, 1 - l)
      const f = (n: number) => l - a * Math.max(-1, Math.min(Math.min(k(n) - 3, 9 - k(n)), 1))
      return [f(0), f(8), f(4)].map((v) => Math.round(v * 255))
    }
    const [r, g, b] = hsl2rgb(h, s, l)
    W.move({ n: 'refCube', ...refCubeProps, b: ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0') })
  }

  // W.camera({ x: 0, y: 0.5, z: 2.5 })

  // Movement speed in units per second
  const MOVE_SPEED = 20

  const { isKeyPressed } = useKeyboard()

  const me = () => getMyState() as PlayerState

  usePointerLock({
    onMove: (e) => {
      updateMyState({ ry: me().ry - e.movementX * 0.1 })
    },
    element: c,
  })

  const updatePlayers = (speed: number) => {
    // Handle all players including local player
    const allPlayers = { ...getPlayerStates(), [ME]: me() }

    for (const playerId in allPlayers) {
      const player = allPlayers[playerId]
      if (!player) continue

      // Move player position
      W.move({ n: playerId, ...player, a: 50 })

      // Animate lion running when moving
      if (player.v) {
        const t = performance.now() * 0.01
        const legOffset = Math.sin(t) * 0.2
        const bounceOffset = Math.abs(Math.sin(t * 2)) * 0.1 // Gallop bounce

        // Animate legs
        W.move({ n: `${playerId}-leg-fl`, y: 0.3 + legOffset })
        W.move({ n: `${playerId}-leg-br`, y: 0.3 + legOffset })
        W.move({ n: `${playerId}-leg-fr`, y: 0.3 - legOffset })
        W.move({ n: `${playerId}-leg-bl`, y: 0.3 - legOffset })

        // Animate whole lion body bouncing
        W.move({ n: `${playerId}-container`, y: bounceOffset })
      } else {
        // Reset legs to standing position
        W.move({ n: `${playerId}-leg-fl`, y: 0.3 })
        W.move({ n: `${playerId}-leg-fr`, y: 0.3 })
        W.move({ n: `${playerId}-leg-bl`, y: 0.3 })
        W.move({ n: `${playerId}-leg-br`, y: 0.3 })

        // Reset body to ground level
        W.move({ n: `${playerId}-container`, y: 0 })
      }
    }
  }

  const updateMe = (speed: number) => {
    const angle = (me().ry * Math.PI) / 180
    const forwardX = Math.sin(angle) * speed
    const forwardZ = Math.cos(angle) * speed
    let isMoving = false

    if (isKeyPressed('w')) {
      updateMyState({ x: me().x - forwardX, z: me().z - forwardZ, v: true })
      isMoving = true
    }
    if (isKeyPressed('s')) {
      updateMyState({ x: me().x + forwardX, z: me().z + forwardZ, v: true })
      isMoving = true
    }
    if (isKeyPressed('a')) {
      updateMyState({ x: me().x - forwardZ, z: me().z + forwardX, v: true })
      isMoving = true
    }
    if (isKeyPressed('d')) {
      updateMyState({ x: me().x + forwardZ, z: me().z - forwardX, v: true })
      isMoving = true
    }

    // Update movement state if not moving
    if (!isMoving && me().v) {
      updateMyState({ v: false })
    }
  }

  spawnMe()

  useSpeedThrottledRaf(MOVE_SPEED, (speed) => {
    updateMe(speed)
    updatePlayers(speed)
    updateRefCube(speed)
  })
}

// Handle demo mode or start the game after DOM is loaded
if (location.search.includes('demo') && import.meta.env.DEV) {
  useDemo()
} else {
  main()
}

export {}
