import { createSongPlayer, MusicPlayer, noteToFrequency, playSingleNote, type Song } from 'lab13-sdk'
import { PortIndependentStorage } from './storage.js'

export type ComposerGridCell = {
  occupied: boolean
  isActive: boolean
}

export type ComposerGridState = ComposerGridCell[][]
class MusicComposer {
  private static readonly LOWEST_NOTE = 'H'.charCodeAt(0) // ASCII 72
  private static readonly HIGHEST_NOTE = 'z'.charCodeAt(0) // ASCII 122
  private static readonly NOTE_RANGE = MusicComposer.HIGHEST_NOTE - MusicComposer.LOWEST_NOTE + 1 // 51 rows

  private grid: ComposerGridState = []
  private gridSize = { rows: MusicComposer.NOTE_RANGE, cols: 64 }
  private isPlaying = false
  private player: MusicPlayer | null = null
  private playheadPosition = 0
  private dragState: { isDragging: boolean; startCell: { row: number; col: number } | null } = {
    isDragging: false,
    startCell: null,
  }
  private lastPlayedCell: { row: number; col: number } | null = null

  // Compress the current grid to a Song
  private compress(baseNote: string = 'i'): Song {
    const song: string[] = []
    const maxCols = this.gridSize.cols
    const baseNoteCode = baseNote.charCodeAt(0)

    // Step 1: Copy the grid
    const gridCopy: ComposerGridState = this.grid.map((row) => row.map((cell) => ({ ...cell })))

    // Step 2-4: Create parts until no notes left
    while (this.hasNotesInGridInternal(gridCopy)) {
      // Create a new part string filled with 0's
      const partString = Array(maxCols).fill('0')

      // For each row, scan through columns
      for (let row = 0; row < this.gridSize.rows; row++) {
        for (let col = 0; col < maxCols; col++) {
          const cell = gridCopy[row]?.[col]
          if (cell?.occupied) {
            if (partString[col] === '0') {
              // Column is empty, place the note
              // Convert row index to note character (row 0 = highest note)
              const noteCode = MusicComposer.HIGHEST_NOTE - row
              const note = String.fromCharCode(noteCode)
              partString[col] = note
              cell.occupied = false // Remove from grid copy
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

  private hasNotesInGridInternal(grid: ComposerGridState): boolean {
    for (let row = 0; row < this.gridSize.rows; row++) {
      const rowData = grid[row]
      if (!rowData) continue

      for (let col = 0; col < this.gridSize.cols; col++) {
        const cell = rowData[col]
        if (cell?.occupied) {
          return true
        }
      }
    }
    return false
  }

  private hasNotesInGrid(): boolean {
    return this.hasNotesInGridInternal(this.grid)
  }

  // Uncompress a song back to a grid for import functionality
  private uncompress(song: Song, baseNote: string = 'i'): ComposerGridState {
    if (song.length === 0) {
      return Array(this.gridSize.rows)
        .fill(null)
        .map(() =>
          Array(this.gridSize.cols)
            .fill(null)
            .map(() => ({ occupied: false, isActive: false }))
        )
    }

    // Infer grid dimensions from song data
    const gridCols = Math.max(...song.map((part) => part.length))
    const baseNoteCode = baseNote.charCodeAt(0)

    // Initialize empty grid
    const grid: ComposerGridState = Array(this.gridSize.rows)
      .fill(null)
      .map(() =>
        Array(gridCols)
          .fill(null)
          .map(() => ({
            occupied: false,
            isActive: false,
          }))
      )

    // Load each part into the grid
    for (let partIndex = 0; partIndex < song.length; partIndex++) {
      const part = song[partIndex]
      if (!part) continue

      for (let charIndex = 0; charIndex < part.length; charIndex++) {
        const note = part[charIndex]
        if (!note || note === '0') continue

        // Convert note to row index (row 0 = highest note)
        const noteCode = note.charCodeAt(0)
        const row = MusicComposer.HIGHEST_NOTE - noteCode

        if (row >= 0 && row < this.gridSize.rows) {
          grid[row][charIndex].occupied = true
        }
      }
    }

    return grid
  }
  private throbbingCells: Set<string> = new Set()
  private audioContext: AudioContext

  constructor() {
    this.audioContext = new AudioContext()
    this.initializeGrid()
    this.loadFromStorage()
    this.setupEventListeners()
    this.renderGrid()
    this.updateOutput()
  }

  private initializeGrid() {
    this.grid = Array(this.gridSize.rows)
      .fill(null)
      .map(() =>
        Array(this.gridSize.cols)
          .fill(null)
          .map(() => ({
            occupied: false,
            isActive: false,
          }))
      )
  }

  private setupEventListeners() {
    const playBtn = document.getElementById('playBtn')!
    const stopBtn = document.getElementById('stopBtn')!
    const clearBtn = document.getElementById('clearBtn')!
    const importBtn = document.getElementById('importBtn')

    playBtn.addEventListener('click', () => this.play())
    stopBtn.addEventListener('click', () => this.stop())
    clearBtn.addEventListener('click', () => this.clear())
    if (importBtn) {
      importBtn.addEventListener('click', () => this.showImportDialog())
    }

    // Keyboard event listeners
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault() // Prevent page scroll
        this.togglePlayStop()
      }
    })

    // Grid event listeners will be set up in renderGrid
  }

  private renderGrid() {
    const gridElement = document.getElementById('grid')!
    gridElement.innerHTML = ''

    // Create column headers
    const colHeader = document.createElement('div')
    colHeader.className = 'col-label'
    colHeader.textContent = ''
    gridElement.appendChild(colHeader)

    for (let col = 0; col < this.gridSize.cols; col++) {
      const colLabel = document.createElement('div')
      colLabel.className = 'col-label'
      colLabel.textContent = (col + 1).toString()
      if (col === this.playheadPosition) {
        colLabel.classList.add('playhead')
      }
      colLabel.addEventListener('click', () => this.setPlayheadPosition(col))
      gridElement.appendChild(colLabel)
    }

    // Create rows
    for (let row = 0; row < this.gridSize.rows; row++) {
      // Row label (H-z, reversed so H is at bottom)
      const rowLabel = document.createElement('div')
      rowLabel.className = 'row-label'
      rowLabel.textContent = String.fromCharCode(MusicComposer.HIGHEST_NOTE - row)
      gridElement.appendChild(rowLabel)

      // Row cells
      for (let col = 0; col < this.gridSize.cols; col++) {
        const cell = document.createElement('div')
        cell.className = 'cell'
        cell.dataset.row = row.toString()
        cell.dataset.col = col.toString()

        if (this.grid[row][col].occupied) {
          cell.classList.add('note')
        }

        if (this.grid[row][col].isActive) {
          cell.classList.add('active')
        }

        if (this.throbbingCells.has(`${row},${col}`)) {
          cell.classList.add('throbbing')
        }

        // Mouse events
        cell.addEventListener('mousedown', (e) => this.handleMouseDown(e, row, col))
        cell.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, row, col))
        cell.addEventListener('mouseup', (e) => this.handleMouseUp(e, row, col))

        gridElement.appendChild(cell)
      }
    }
  }

  private handleMouseDown(e: MouseEvent, row: number, col: number) {
    e.preventDefault()
    this.dragState.isDragging = true
    this.dragState.startCell = { row, col }

    const cell = this.grid[row][col]
    if (!cell.occupied) {
      // Empty cell: add note and play it
      cell.occupied = true
      this.renderGrid()
      this.updateOutput()
      this.saveToStorage()
    }

    // Play preview sound
    this.playNote(row, col)
  }

  private handleMouseEnter(e: MouseEvent, row: number, col: number) {
    if (!this.dragState.isDragging || !this.dragState.startCell) return

    // Play sound when crossing cell boundaries during drag
    if (!this.lastPlayedCell || this.lastPlayedCell.row !== row || this.lastPlayedCell.col !== col) {
      this.playNote(row, col)
      this.lastPlayedCell = { row, col }
    }
  }

  private handleMouseUp(e: MouseEvent, row: number, col: number) {
    if (!this.dragState.isDragging || !this.dragState.startCell) return

    const startCell = this.dragState.startCell
    const startRow = startCell.row
    const startCol = startCell.col

    // Check if mouseup is in the same cell as mousedown
    if (startRow === row && startCol === col) {
      // Same cell: remove note if it was occupied
      if (this.grid[startRow][startCol].occupied) {
        this.grid[startRow][startCol].occupied = false
        this.renderGrid()
        this.updateOutput()
        this.saveToStorage()
      }
    } else {
      // Different cell: move note from start to current cell
      if (this.grid[startRow][startCol].occupied) {
        // Remove note from start cell
        this.grid[startRow][startCol].occupied = false
        // Add note to current cell
        this.grid[row][col].occupied = true
        this.renderGrid()
        this.updateOutput()
        this.saveToStorage()
      }
    }

    this.dragState.isDragging = false
    this.dragState.startCell = null
    this.lastPlayedCell = null
  }

  private playNote(row: number, col: number) {
    // Calculate frequency for preview
    const note = String.fromCharCode(MusicComposer.HIGHEST_NOTE - row)
    const frequency = noteToFrequency(note)

    playSingleNote(this.audioContext, frequency, this.audioContext.currentTime, {
      noteLengthMs: 200,
      volume: 0.1,
    })
  }

  private setPlayheadPosition(col: number) {
    this.playheadPosition = col
    this.renderGrid()
    this.updateStatus(`Playhead set to column ${col + 1}`)
  }

  private createShiftedGrid(): ComposerGridState {
    // Step 1: Find the highest grid column containing a note
    let highestCol = -1
    for (let col = this.gridSize.cols - 1; col >= 0; col--) {
      for (let row = 0; row < this.gridSize.rows; row++) {
        if (this.grid[row][col].occupied) {
          highestCol = col
          break
        }
      }
      if (highestCol !== -1) break
    }

    console.log('highestCol', highestCol)

    // If no notes found, return empty grid
    if (highestCol === -1) {
      return Array(this.gridSize.rows)
        .fill(null)
        .map(() => [])
    }

    // Step 2: Create a new empty grid
    const shiftedGrid: ComposerGridState = Array(this.gridSize.rows)
      .fill(null)
      .map(() =>
        Array(this.gridSize.cols)
          .fill(null)
          .map(() => ({
            occupied: false,
            isActive: false,
          }))
      )

    // Step 3: Copy notes from playhead to highest column
    for (let row = 0; row < this.gridSize.rows; row++) {
      for (let col = this.playheadPosition; col <= highestCol; col++) {
        const sourceCell = this.grid[row][col]
        if (sourceCell.occupied) {
          shiftedGrid[row][col - this.playheadPosition] = {
            occupied: true,
            isActive: false,
          }
        }
      }
    }
    console.log('shiftedGrid step 3', JSON.stringify(shiftedGrid))

    // Step 4: Copy notes from 1st column up to playhead
    for (let row = 0; row < this.gridSize.rows; row++) {
      for (let col = 0; col < this.playheadPosition; col++) {
        const sourceCell = this.grid[row][col]
        if (sourceCell.occupied) {
          const targetCol = highestCol - this.playheadPosition + 1 + col
          shiftedGrid[row][targetCol] = {
            occupied: true,
            isActive: false,
          }
        }
      }
    }
    console.log('shiftedGrid step 4', JSON.stringify(shiftedGrid))

    return shiftedGrid
  }

  private play() {
    if (this.isPlaying) return

    if (!this.hasNotesInGrid()) {
      this.updateStatus('No notes to play')
      return
    }

    this.isPlaying = true
    this.updateStatus('Playing...')

    const song = this.compress()
    console.log('song', song)
    this.player = createSongPlayer(song)
    this.player.play({
      onNotesPlayed: (col: number) => this.onNotesPlayed(col),
    })
  }

  private stop() {
    if (!this.isPlaying) return

    this.isPlaying = false
    this.throbbingCells.clear()
    this.updateStatus('Stopped')

    if (this.player) {
      this.player.stop()
      this.player = null
    }

    // Clear highlighting
    this.renderGrid()
  }

  private togglePlayStop() {
    if (this.isPlaying) {
      this.stop()
    } else {
      this.play()
    }
  }

  private clear() {
    this.initializeGrid()
    this.renderGrid()
    this.updateOutput()
    this.saveToStorage()
    this.updateStatus('Grid cleared')
  }

  // Import a song into the grid
  public importSong(song: Song, baseNote: string = 'i') {
    const importedGrid = this.uncompress(song, baseNote)

    // Clear current grid
    this.initializeGrid()

    // Copy imported notes to current grid
    for (let row = 0; row < Math.min(importedGrid.length, this.gridSize.rows); row++) {
      for (let col = 0; col < Math.min(importedGrid[row].length, this.gridSize.cols); col++) {
        if (importedGrid[row][col].occupied) {
          this.grid[row][col].occupied = true
        }
      }
    }

    this.renderGrid()
    this.updateOutput()
    this.saveToStorage()
    this.updateStatus(`Imported song with ${song.length} parts`)
  }

  private showImportDialog() {
    const input = prompt('Paste song array (e.g., ["ace", "bd"]):')
    if (!input) return

    try {
      const song = JSON.parse(input)
      if (Array.isArray(song) && song.every((part) => typeof part === 'string')) {
        this.importSong(song)
      } else {
        this.updateStatus('Invalid song format. Expected array of strings.')
      }
    } catch (error) {
      this.updateStatus('Invalid JSON format.')
    }
  }

  private onNotesPlayed(col: number) {
    // Highlight all notes in this column
    for (let row = 0; row < this.gridSize.rows; row++) {
      if (this.grid[row][col].occupied) {
        const cellKey = `${row},${col}`
        this.throbbingCells.add(cellKey)
      }
    }
    this.renderGrid()

    // Remove the throb after animation
    setTimeout(() => {
      for (let row = 0; row < this.gridSize.rows; row++) {
        if (this.grid[row][col].occupied) {
          const cellKey = `${row},${col}`
          this.throbbingCells.delete(cellKey)
        }
      }
      this.renderGrid()
    }, 200)
  }

  private saveToStorage() {
    try {
      // Save the raw grid state
      const gridData = this.grid.map((row) =>
        row.map((cell) => ({
          occupied: cell.occupied,
          isActive: false, // Don't save active state
        }))
      )

      // Try port-independent storage first
      if (typeof PortIndependentStorage !== 'undefined') {
        PortIndependentStorage.save(gridData)
      } else {
        // Fallback to regular localStorage
        localStorage.setItem('musicComposer_grid', JSON.stringify(gridData))
      }
    } catch (error) {
      console.warn('Could not save to storage:', error)
    }
  }

  private loadFromStorage() {
    try {
      let gridData = null

      // Try port-independent storage first
      if (typeof PortIndependentStorage !== 'undefined') {
        gridData = PortIndependentStorage.load()
      }

      // Fallback to regular localStorage
      if (!gridData) {
        const saved = localStorage.getItem('musicComposer_grid')
        if (saved) {
          gridData = JSON.parse(saved)
        }
      }

      if (gridData) {
        this.loadGridFromData(gridData)
      }
    } catch (error) {
      console.warn('Could not load from storage:', error)
    }
  }

  private loadGridFromData(gridData: any[][]) {
    // Clear the grid first
    this.initializeGrid()

    // Load the saved grid data
    for (let row = 0; row < Math.min(gridData.length, this.gridSize.rows); row++) {
      for (let col = 0; col < Math.min(gridData[row].length, this.gridSize.cols); col++) {
        if (gridData[row] && gridData[row][col]) {
          const cellData = gridData[row][col]
          // Handle both old and new format for backward compatibility
          if (cellData.occupied !== undefined) {
            this.grid[row][col].occupied = cellData.occupied
          } else if (cellData.note) {
            // Old format: convert note to occupied
            this.grid[row][col].occupied = true
          }
          // Don't restore isActive state - it should always start as false
        }
      }
    }
  }

  private updateOutput() {
    const output = document.getElementById('output')!
    const song = this.compress()

    if (song.length === 0) {
      output.textContent = 'Click cells to place notes. Drag to move notes around.'
      return
    }

    const outputText = song.map((part, index) => `Part ${index + 1}: ${part}`).join('\n')

    output.textContent = `Compressed Song:\n${outputText}\n\nRaw format:\n${JSON.stringify(song)}`
  }

  private updateStatus(message: string) {
    const status = document.getElementById('status')!
    status.textContent = message
  }
}

// Initialize the composer when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new MusicComposer()
})

// Global mouse up handler to handle drag end outside grid
document.addEventListener('mouseup', () => {
  // This will be handled by the composer instance
})
