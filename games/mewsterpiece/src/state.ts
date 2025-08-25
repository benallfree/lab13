import { cats } from './cats'

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
}

// Constants for simplified timing
const LEVEL_DURATION = 60 * 1000 // 60 seconds
const BREAK_DURATION = 10 * 1000 // 10 seconds

export const state: GameState = {
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
          state.completedPictures.set(id, picture)
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
  if (!state.hasDrawnPixels) {
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
  state.completedPictures.set(pictureId, picture)
  try {
    localStorage.setItem(`mewsterpiece-picture-${pictureId}`, JSON.stringify(picture))

    // Update the main index
    const pictureIds = Array.from(state.completedPictures.keys())
    localStorage.setItem('mewsterpiece-pictures-index', JSON.stringify(pictureIds))
  } catch (error) {
    console.error('Failed to save completed picture:', error)
  }
}

// Delete a completed picture
export function deleteCompletedPicture(pictureId: string) {
  state.completedPictures.delete(pictureId)
  try {
    // Remove the individual picture
    localStorage.removeItem(`mewsterpiece-picture-${pictureId}`)

    // Update the main index
    const pictureIds = Array.from(state.completedPictures.keys())
    localStorage.setItem('mewsterpiece-pictures-index', JSON.stringify(pictureIds))
  } catch (error) {
    console.error('Failed to delete completed picture:', error)
  }
}

// Clear all completed pictures
export function clearAllCompletedPictures() {
  try {
    // Get all picture IDs and remove them
    const pictureIds = Array.from(state.completedPictures.keys())
    pictureIds.forEach((id) => {
      localStorage.removeItem(`mewsterpiece-picture-${id}`)
    })

    // Clear the main index
    localStorage.removeItem('mewsterpiece-pictures-index')
    state.completedPictures.clear()
  } catch (error) {
    console.error('Failed to clear completed pictures:', error)
  }
}

// Get current game state based on startedAt time
export function getCurrentGameState(): GameState {
  const now = Date.now()
  const startOffset = now - state.shared.startedAt

  // Calculate total cycle time (level + break)
  const cycleTime = LEVEL_DURATION + BREAK_DURATION
  const cycleOffset = startOffset % cycleTime

  // Determine if we're in a level or break
  const isInLevel = cycleOffset < LEVEL_DURATION
  const isInBreak = !isInLevel

  // Calculate current level (cycles completed)
  const cyclesCompleted = Math.floor(startOffset / cycleTime)
  const currentLevel = cyclesCompleted % cats.length

  // Calculate time remaining
  let timeRemaining = 0
  let breakTimeRemaining = 0

  if (isInLevel) {
    timeRemaining = LEVEL_DURATION - cycleOffset
  } else {
    breakTimeRemaining = cycleTime - cycleOffset
  }

  console.log(
    'newState',
    JSON.stringify(
      {
        startOffset,
        cycleOffset,
        cyclesCompleted,
        currentLevel,
        timeRemaining,
        isInLevel,
        isInBreak,
        breakTimeRemaining,
      },
      null,
      2
    )
  )

  const newState = {
    ...state,
    currentLevel,
    timeRemaining,
    isInLevel,
    isInBreak,
    breakTimeRemaining,
  }

  return newState
}

// Initialize completed pictures on module load
loadCompletedPictures()
