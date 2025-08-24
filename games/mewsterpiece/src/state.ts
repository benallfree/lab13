import { cats, LEVEL_PAUSE_DURATION, TOTAL_MATCH_DURATION } from './constants'

export type SharedState = {
  img: string
  startedAt: number
  matchNumber: number
}

type GameState = {
  currentLevel: number
  timeRemaining: number
  isInLevel: boolean
  isInPause: boolean
  isInMatchPause: boolean
  pauseTimeRemaining: number
  shared: SharedState
  isDrawing: boolean
  isInitialized: boolean
  completedLevels: Set<number>
}

export const state: GameState = {
  currentLevel: 0,
  timeRemaining: 0,
  isInLevel: false,
  isInPause: false,
  isInMatchPause: false,
  pauseTimeRemaining: 0,
  shared: {
    img: '',
    startedAt: Date.now(),
    matchNumber: 1,
  },
  isDrawing: false,
  isInitialized: false,
  completedLevels: new Set(),
}

// Get current game state based on startedAt time
export function getCurrentGameState(): GameState {
  const now = Date.now()
  const matchStartTime = state.shared.startedAt + (state.shared.matchNumber - 1) * TOTAL_MATCH_DURATION
  const timeSinceMatchStart = now - matchStartTime

  // Check if we're in match pause
  if (timeSinceMatchStart < 0) {
    return {
      ...state,
      currentLevel: 0,
      timeRemaining: Math.abs(timeSinceMatchStart),
      isInLevel: false,
      isInPause: false,
      isInMatchPause: true,
      pauseTimeRemaining: Math.abs(timeSinceMatchStart),
    }
  }

  let accumulatedTime = 0

  // Check each level
  for (let level = 0; level < cats.length; level++) {
    const levelDuration = cats[level].ttl
    const levelStartTime = accumulatedTime
    const levelEndTime = accumulatedTime + levelDuration
    const pauseStartTime = levelEndTime
    const pauseEndTime = pauseStartTime + LEVEL_PAUSE_DURATION

    // Check if we're in this level
    if (timeSinceMatchStart >= levelStartTime && timeSinceMatchStart < levelEndTime) {
      return {
        ...state,
        currentLevel: level,
        timeRemaining: levelEndTime - timeSinceMatchStart,
        isInLevel: true,
        isInPause: false,
        isInMatchPause: false,
        pauseTimeRemaining: 0,
      }
    }

    // Check if we're in pause after this level
    if (timeSinceMatchStart >= pauseStartTime && timeSinceMatchStart < pauseEndTime) {
      return {
        ...state,
        currentLevel: level,
        timeRemaining: 0,
        isInLevel: false,
        isInPause: true,
        isInMatchPause: false,
        pauseTimeRemaining: pauseEndTime - timeSinceMatchStart,
      }
    }

    accumulatedTime += levelDuration + LEVEL_PAUSE_DURATION
  }

  // If we've passed all levels, wrap around to the beginning
  // Increment match number and reset to first level
  state.shared.matchNumber++

  return {
    ...state,
    currentLevel: 0,
    timeRemaining: cats[0].ttl,
    isInLevel: true,
    isInPause: false,
    isInMatchPause: false,
    pauseTimeRemaining: 0,
  }
}
