import { noteToFrequency } from './player.js'

// Composer grid cell with metadata
export type ComposerGridCell = {
  note: string | null
  frequency: number | null
  isActive: boolean
}

// Player grid cell - only frequency for audio playback
export type PlayerGridCell = {
  frequency: number
}

export type ComposerGridState = ComposerGridCell[][]
export type PlayerGridState = PlayerGridCell[][]
export type Part = string
export type Song = Part[]

export const compress = (grid: ComposerGridState): string[] => {
  const song: string[] = []
  const maxCols = findMaxColumns(grid)

  // Step 1: Copy the grid
  const gridCopy: ComposerGridState = grid.map((row) => row.map((cell) => ({ ...cell })))

  // Step 2-4: Create parts until no notes left
  while (hasNotesInGrid(gridCopy)) {
    // Create a new part string filled with 0's
    const partString = Array(maxCols).fill('0')

    // For each row, scan through columns
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < maxCols; col++) {
        const cell = gridCopy[row]?.[col]
        if (cell?.note) {
          if (partString[col] === '0') {
            // Column is empty, place the note
            partString[col] = cell.note
            cell.note = null // Remove from grid copy
          }
          // If column is occupied, note stays in grid for next part
        }
      }
    }

    song.push(partString.join(''))
  }

  // Step 5: Remove trailing zeros from each part
  return song.map((part) => part.replace(/0+$/, ''))
}

export const compressForPlayer = (grid: ComposerGridState): PlayerGridState => {
  const maxCols = findMaxColumns(grid)
  const playerGrid: PlayerGridState = Array(grid.length)
    .fill(null)
    .map(() =>
      Array(maxCols)
        .fill(null)
        .map(() => ({
          frequency: 0,
        }))
    )

  // Copy only frequency data to player grid
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < maxCols; col++) {
      const cell = grid[row]?.[col]
      if (cell?.frequency) {
        const playerCell = playerGrid[row]?.[col]
        if (playerCell) {
          playerCell.frequency = cell.frequency
        }
      }
    }
  }

  return playerGrid
}

export const uncompress = (song: string[], gridRows: number, gridCols: number): ComposerGridState => {
  // Initialize empty grid
  const grid: ComposerGridState = Array(gridRows)
    .fill(null)
    .map(() =>
      Array(gridCols)
        .fill(null)
        .map(() => ({
          note: null,
          frequency: null,
          isActive: false,
        }))
    )

  // Load each part into the grid
  // Each part represents a time step, and notes in the same column play simultaneously
  for (let partIndex = 0; partIndex < song.length && partIndex < gridCols; partIndex++) {
    const part = song[partIndex]
    if (!part) continue

    for (let charIndex = 0; charIndex < part.length; charIndex++) {
      const note = part[charIndex]
      if (note && note !== '0') {
        // Find the row for this note (assuming H-z range)
        const HIGHEST_NOTE = 'z'.charCodeAt(0) // ASCII 122
        const noteCode: number = note.charCodeAt(0)
        const row = HIGHEST_NOTE - noteCode
        if (row >= 0 && row < gridRows) {
          const cell = grid[row]?.[partIndex]
          if (cell) {
            cell.note = note
            // Calculate frequency from note (A4 = 440Hz)
            cell.frequency = noteToFrequency(note)
          }
        }
      }
    }
  }

  return grid
}

const findMaxColumns = (grid: ComposerGridState): number => {
  let maxCol = 0
  for (let row = 0; row < grid.length; row++) {
    const rowData = grid[row]
    if (!rowData) continue

    for (let col = rowData.length - 1; col >= 0; col--) {
      const cell = rowData[col]
      if (cell?.note) {
        maxCol = Math.max(maxCol, col + 1)
        break
      }
    }
  }
  return Math.max(1, maxCol)
}

const hasNotesInGrid = (grid: ComposerGridState): boolean => {
  for (let row = 0; row < grid.length; row++) {
    const rowData = grid[row]
    if (!rowData) continue

    for (let col = 0; col < rowData.length; col++) {
      const cell = rowData[col]
      if (cell?.note) {
        return true
      }
    }
  }
  return false
}
