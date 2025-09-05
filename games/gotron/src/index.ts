/// <reference types="lab13-sdk/W" />

import {
  generateUUID,
  PartialDeep,
  StateBase,
  useDemo,
  useEasyState,
  useKeyboard,
  useMyId,
  useOnline,
  usePointerLock,
  useResizer,
  useSpeedThrottledRaf,
  useW,
} from 'lab13-sdk'
import { createWorld, GROUND_SIZE } from './createWorld'
import { ensureLionModel, gcLionModels, transformLionModel, walk } from './lion'

export type PlayerAltMode = 'c' | 'b' // 'c' for cat or 'b' for bot
export type MovementMode = 'w' | 's' | 'r' // walking or standing or roaming

export type PlayerState = {
  w: {
    x: number
    z: number
    ry: number
    b: string
  }
  v: MovementMode
  m: PlayerAltMode
}

const BOT_INTERMEDIATE_TARGET_THRESHOLD = 25 // Choose an intermediate target if the distance to the final target is greater than this
const BOT_ARRIVAL_RADIUS = 0.2 // Stop moving if within this distance of the next target
const BOT_MIN_SLEEP = 5000 // Minimum sleep duration in milliseconds
const BOT_MAX_SLEEP = 5000 // Maximum sleep duration in milliseconds
const BOT_MIN_SPAWN_DELAY = 5000 // Minimum delay between bot spawn checks in milliseconds
const BOT_MAX_SPAWN_DELAY = 5000 // Maximum delay between bot spawn checks in milliseconds
export type PlayerId = string
export type BotState = PlayerState & {
  // Owning player ID
  o: PlayerId

  // target metadata (private, not relayed)
  _t: {
    f?: { x: number; z: number } // final destination
    n?: { x: number; z: number } // next target
    s: number // sleep time until next target
  }
}
export type GameState = StateBase<PlayerState | BotState>

function isBotState(state: PartialDeep<PlayerState | BotState>): state is BotState {
  return 'o' in state
}

function main() {
  useW()
  useOnline(`mewsterpiece/gotron`)
  const { getMyId } = useMyId()
  const { updateMyState, getMyState, getPlayerStates, updatePlayerState, getPlayerState, updateState, getState } =
    useEasyState<GameState>({
      positionPrecision: 2,
      rotationPrecision: 2,
      rotationUnits: 'd',
      onPlayerStateAvailable: (id, state) => spawnPlayer(id, state),
      debug: true,
    })
  useResizer()

  const ME = getMyId()

  const PLAYER_COLORS = ['f00', '00f', 'ff0', '0f0', '000'] // red, blue, yellow, green,  black

  const spawnMe = () => {
    const r = 10 * Math.sqrt(Math.random()),
      a = Math.random() * Math.PI * 2
    // Create a cube sitting in the middle of the plane
    const props: PlayerState = {
      w: {
        x: Math.cos(a) * r,
        z: Math.sin(a) * r,
        ry: (Math.atan2(Math.cos(a) * r, Math.sin(a) * r) * 180) / Math.PI,
        b: PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)],
      },
      v: 's',
      m: 'c',
    }
    ensureLionModel(ME, props)

    W.camera({ g: ME, x: 0, y: 1.5, z: 2.5 })
    updateMyState(props)
  }

  const spawnPlayer = (id: string, state: PlayerState | BotState) => {
    console.log('spawnPlayer', id)
    ensureLionModel(id, state)
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

  // Movement speed in units per second
  const MOVE_SPEED = 20

  const { isKeyPressed } = useKeyboard()

  const me = () => getMyState() as PlayerState

  usePointerLock({
    onMove: (e) => {
      updateMyState({ w: { ry: me().w.ry - e.movementX * 0.1 } })
    },
    element: c,
  })

  const updatePlayers = (speed: number) => {
    // Handle all players including local player
    const allPlayers = { ...getPlayerStates() }

    for (const playerId in allPlayers) {
      const player = allPlayers[playerId] as PlayerState | BotState
      ensureLionModel(playerId, player)

      // DEV mode toggle
      if (import.meta.env.DEV) {
        updateMyState({ m: isKeyPressed('.') ? 'b' : 'c' })
        transformLionModel(playerId, player)
      }

      // Move player position
      W.move({ n: playerId, ...player.w, a: 50 })

      // Animate lion running when moving
      walk(playerId, player.v === 'w' ? performance.now() * 0.01 : 0)
    }
  }

  const updateMe = (speed: number) => {
    const angle = (me().w.ry * Math.PI) / 180
    const forwardX = Math.sin(angle) * speed
    const forwardZ = Math.cos(angle) * speed
    let isMoving = false

    if (isKeyPressed('w')) {
      updateMyState({ w: { x: me().w.x - forwardX, z: me().w.z - forwardZ }, v: 'w' })
      isMoving = true
    }
    if (isKeyPressed('s')) {
      updateMyState({ w: { x: me().w.x + forwardX, z: me().w.z + forwardZ }, v: 'w' })
      isMoving = true
    }
    if (isKeyPressed('a')) {
      updateMyState({ w: { x: me().w.x - forwardZ, z: me().w.z + forwardX }, v: 'w' })
      isMoving = true
    }
    if (isKeyPressed('d')) {
      updateMyState({ w: { x: me().w.x + forwardZ, z: me().w.z - forwardX }, v: 'w' })
      isMoving = true
    }

    // Update movement state if not moving
    if (!isMoving && me().v) {
      updateMyState({ v: 's' })
    }
  }

  const updateBots = (speed: number) => {
    const allPlayers = getPlayerStates()

    for (const playerId in allPlayers) {
      const player = allPlayers[playerId]!
      if (!isBotState(player)) continue

      const bot = player

      // Only update bots owned by the current player (since _t is private)
      if (bot.o !== ME) continue
      const currentTime = performance.now()

      // If bot is sleeping and not yet time to wake up, skip
      if (bot._t.s > 0 && currentTime < bot._t.s) {
        continue
      }

      // If it's time to wake up, set _t = { s: 0 }
      if (bot._t.s > 0 && currentTime >= bot._t.s) {
        bot._t = { s: 0 }
      }

      // If there is no final target, choose one that is farther away than the arrival threshold
      if (!bot._t.f) {
        const finalR = (GROUND_SIZE / 2) * Math.sqrt(Math.random())
        const finalA = Math.random() * Math.PI * 2
        const newFinalTarget = {
          x: Math.cos(finalA) * finalR,
          z: Math.sin(finalA) * finalR,
        }
        bot._t.f = newFinalTarget
      }

      // If there is no _t.n target, choose one that is farther away than the arrival threshold
      if (!bot._t.n) {
        // Assume to final target, set intermediate to final
        bot._t.n = bot._t.f

        const finalDx = bot._t.f.x - bot.w.x
        const finalDz = bot._t.f.z - bot.w.z
        const distanceToFinal = Math.sqrt(finalDx * finalDx + finalDz * finalDz)

        if (distanceToFinal > BOT_INTERMEDIATE_TARGET_THRESHOLD) {
          // Choose intermediate target within 45 degrees of final direction
          const finalDirection = Math.atan2(finalDz, finalDx)
          const angleVariation = ((Math.random() - 0.5) * Math.PI) / 2 // ±45 degrees
          const intermediateDirection = finalDirection + angleVariation

          // Choose distance for intermediate target, bounded by GROUND_SIZE
          const maxDistance = Math.min(distanceToFinal, GROUND_SIZE / 2)
          const intermediateDistance = Math.random() * Math.min(maxDistance, BOT_INTERMEDIATE_TARGET_THRESHOLD)

          const newIntermediateTarget = {
            x: bot.w.x + Math.cos(intermediateDirection) * intermediateDistance,
            z: bot.w.z + Math.sin(intermediateDirection) * intermediateDistance,
          }
          bot._t.n = newIntermediateTarget
        }
      }

      // Check to see if we've arrived at _t.n
      const dx = bot._t.n.x - bot.w.x
      const dz = bot._t.n.z - bot.w.z
      const distanceToTarget = Math.sqrt(dx * dx + dz * dz)

      if (distanceToTarget <= BOT_ARRIVAL_RADIUS) {
        // If we arrived, set _t = { s: <duration> }
        const sleepDuration = BOT_MIN_SLEEP + Math.random() * (BOT_MAX_SLEEP - BOT_MIN_SLEEP)
        updatePlayerState(playerId, {
          v: 's',
          _t: { s: currentTime + sleepDuration },
        })
        continue
      }

      // If we are not there yet, fix rotation and start walking toward _t.n
      const moveSpeed = speed * 0.5 // Bots move at half speed
      const moveX = (dx / distanceToTarget) * moveSpeed
      const moveZ = (dz / distanceToTarget) * moveSpeed
      const targetRotation = (Math.atan2(dx, dz) * 180) / Math.PI + 180 // Face the target direction

      updatePlayerState(playerId, {
        w: {
          x: bot.w.x + moveX,
          z: bot.w.z + moveZ,
          ry: targetRotation,
        },
        v: 'w',
      })
    }
  }

  spawnMe()

  // Check for missing lion colors every 1 second
  const spawnMissingLionBots = () => {
    const playerStates = getPlayerStates()
    const existingColors = new Set<string>()

    // Collect existing colors from all players
    for (const playerId in playerStates) {
      const state = playerStates[playerId] as PlayerState
      existingColors.add(state.w.b)
    }

    const firstMissingColor = PLAYER_COLORS.find((color) => !existingColors.has(color))
    if (firstMissingColor) {
      const r = 10 * Math.sqrt(Math.random())
      const a = Math.random() * Math.PI * 2
      const botId = `bot-${generateUUID()}`
      const currentTime = performance.now()
      const sleepDuration = BOT_MIN_SLEEP + Math.random() * (BOT_MAX_SLEEP - BOT_MIN_SLEEP)

      const botState: BotState = {
        w: {
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
          ry: (Math.atan2(Math.cos(a) * r, Math.sin(a) * r) * 180) / Math.PI,
          b: firstMissingColor,
        },
        v: 's',
        o: ME,
        m: 'b',
        _t: {
          f: { x: 0, z: 0 }, // Will be set when bot wakes up
          n: { x: 0, z: 0 }, // Will be set when bot wakes up
          s: currentTime + sleepDuration,
        },
      }
      updatePlayerState(botId, botState)
    }
    setTimeout(spawnMissingLionBots, BOT_MIN_SPAWN_DELAY + Math.random() * (BOT_MAX_SPAWN_DELAY - BOT_MIN_SPAWN_DELAY))
  }
  setTimeout(spawnMissingLionBots, BOT_MIN_SPAWN_DELAY + Math.random() * (BOT_MAX_SPAWN_DELAY - BOT_MIN_SPAWN_DELAY))

  const gc = () => {
    const playerStates = getPlayerStates()
    for (const playerId in playerStates) {
      const playerState = playerStates[playerId]!
      if (!isBotState(playerState)) continue
      // It's a bot, check if it's orphaned
      const isOrphaned = !playerStates[playerState.o]
      if (isOrphaned) {
        updatePlayerState(playerId, null)
      }
    }
    const playerIds = Object.keys(playerStates)
    gcLionModels(playerIds)
  }

  useSpeedThrottledRaf(MOVE_SPEED, (speed) => {
    gc()
    updateMe(speed)
    updateBots(speed)
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
