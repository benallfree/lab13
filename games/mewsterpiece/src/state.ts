import { levels } from './levels'

export type SharedState = {
  img: string
  startedAt: number
}

type CompletedPicture = {
  imageData: string
  completedAt: number
  catName: string
  levelIndex: number
}

type GameState = {
  currentLevel: number
  timeRemaining: number
  isInLevel: boolean
  isInBreak: boolean
  breakTimeRemaining: number
  shared: SharedState
  isDrawing: boolean
  isInitialized: boolean
  completedPictures: Map<string, CompletedPicture> // Store completed pictures with unique IDs
  hasDrawnPixels: boolean // Track if any pixels have been drawn on current level
  playerName: string // Player's chosen name
  currentSong: any // Track the currently playing song
  colorHistory: string[] // Store the 10 most recently picked colors
}

// Constants for simplified timing
const LEVEL_DURATION = 60 * 1000 // 60 seconds
const BREAK_DURATION = 10 * 1000 // 10 seconds

export const localState: GameState = {
  currentLevel: 0,
  timeRemaining: LEVEL_DURATION,
  isInLevel: true,
  isInBreak: false,
  breakTimeRemaining: 0,
  shared: {
    img: '',
    startedAt: Date.now(),
  },
  isDrawing: false,
  isInitialized: false,
  completedPictures: new Map(),
  hasDrawnPixels: false,
  playerName: 'Anonymous',
  currentSong: null,
  colorHistory: [],
}

// Load completed pictures from local storage
function loadCompletedPictures() {
  try {
    // Load the main index
    const indexStored = localStorage.getItem('mewsterpiece-pictures-index')
    if (indexStored) {
      const pictureIds = JSON.parse(indexStored) as string[]

      // Load each individual picture
      pictureIds.forEach((id) => {
        const pictureStored = localStorage.getItem(`mewsterpiece-picture-${id}`)
        if (pictureStored) {
          const picture = JSON.parse(pictureStored) as CompletedPicture
          localState.completedPictures.set(id, picture)
        }
      })
    }
  } catch (error) {
    console.error('Failed to load completed pictures:', error)
  }
}

// Save completed pictures to local storage
export function saveCompletedPicture(levelIndex: number, imageData: string, catName: string) {
  // Only save if pixels have been drawn on this level
  if (!localState.hasDrawnPixels) {
    return
  }

  // Generate unique ID for this picture
  const pictureId = `${levelIndex}-${Date.now()}`

  const picture: CompletedPicture = {
    imageData,
    completedAt: Date.now(),
    catName,
    levelIndex,
  }

  // Save the individual picture
  localState.completedPictures.set(pictureId, picture)
  try {
    localStorage.setItem(`mewsterpiece-picture-${pictureId}`, JSON.stringify(picture))

    // Update the main index
    const pictureIds = Array.from(localState.completedPictures.keys())
    localStorage.setItem('mewsterpiece-pictures-index', JSON.stringify(pictureIds))
  } catch (error) {
    console.error('Failed to save completed picture:', error)
  }
}

// Delete a completed picture
export function deleteCompletedPicture(pictureId: string) {
  localState.completedPictures.delete(pictureId)
  try {
    // Remove the individual picture
    localStorage.removeItem(`mewsterpiece-picture-${pictureId}`)

    // Update the main index
    const pictureIds = Array.from(localState.completedPictures.keys())
    localStorage.setItem('mewsterpiece-pictures-index', JSON.stringify(pictureIds))
  } catch (error) {
    console.error('Failed to delete completed picture:', error)
  }
}

// Clear all completed pictures
export function clearAllCompletedPictures() {
  try {
    // Get all picture IDs and remove them
    const pictureIds = Array.from(localState.completedPictures.keys())
    pictureIds.forEach((id) => {
      localStorage.removeItem(`mewsterpiece-picture-${id}`)
    })

    // Clear the main index
    localStorage.removeItem('mewsterpiece-pictures-index')
    localState.completedPictures.clear()
  } catch (error) {
    console.error('Failed to clear completed pictures:', error)
  }
}

// Get current game state based on startedAt time
export function getCurrentGameState(): GameState {
  const now = Date.now()
  const startOffset = now - localState.shared.startedAt

  // Calculate total cycle time (level + break)
  const cycleTime = LEVEL_DURATION + BREAK_DURATION
  const cycleOffset = startOffset % cycleTime

  // Determine if we're in a level or break
  const isInLevel = cycleOffset < LEVEL_DURATION
  const isInBreak = !isInLevel

  // Calculate current level (cycles completed)
  const cyclesCompleted = Math.floor(startOffset / cycleTime)
  const currentLevel = cyclesCompleted % levels.length

  // Calculate time remaining
  let timeRemaining = 0
  let breakTimeRemaining = 0

  if (isInLevel) {
    timeRemaining = LEVEL_DURATION - cycleOffset
  } else {
    breakTimeRemaining = cycleTime - cycleOffset
  }

  // console.log(
  //   'newState',
  //   JSON.stringify(
  //     {
  //       startOffset,
  //       cycleOffset,
  //       cyclesCompleted,
  //       currentLevel,
  //       timeRemaining,
  //       isInLevel,
  //       isInBreak,
  //       breakTimeRemaining,
  //     },
  //     null,
  //     2
  //   )
  // )

  const newState = {
    ...localState,
    currentLevel,
    timeRemaining,
    isInLevel,
    isInBreak,
    breakTimeRemaining,
  }

  return newState
}

// Color history functions
function loadColorHistory() {
  try {
    const stored = localStorage.getItem('mewsterpiece-color-history')
    if (stored) {
      localState.colorHistory = JSON.parse(stored) as string[]
    }
  } catch (error) {
    console.error('Failed to load color history:', error)
    localState.colorHistory = []
  }
}

function saveColorHistory() {
  try {
    localStorage.setItem('mewsterpiece-color-history', JSON.stringify(localState.colorHistory))
  } catch (error) {
    console.error('Failed to save color history:', error)
  }
}

export function addColorToHistory(color: string) {
  // Add the color to the beginning of the array
  localState.colorHistory.unshift(color)

  // Filter out duplicates, keeping the first occurrence (most recent)
  const seen = new Set<string>()
  localState.colorHistory = localState.colorHistory.filter((c) => {
    if (seen.has(c)) {
      return false
    }
    seen.add(c)
    return true
  })

  // Keep only the 10 most recent colors
  if (localState.colorHistory.length > 10) {
    localState.colorHistory = localState.colorHistory.slice(0, 10)
  }

  // Save to localStorage
  saveColorHistory()
}

// Player name localStorage functions
function loadPlayerName() {
  try {
    const stored = localStorage.getItem('mewsterpiece-player-name')
    if (stored) {
      localState.playerName = stored
    }
  } catch (error) {
    console.error('Failed to load player name:', error)
  }
}

function savePlayerName(name: string) {
  try {
    localStorage.setItem('mewsterpiece-player-name', name)
    localState.playerName = name
  } catch (error) {
    console.error('Failed to save player name:', error)
  }
}

export { loadPlayerName, savePlayerName }

// Initialize completed pictures, color history, and player name on module load
loadCompletedPictures()
loadColorHistory()
loadPlayerName()
