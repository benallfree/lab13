import {
  compress,
  compressForPlayer,
  createGridPlayer,
  noteToFrequency,
  playSingleNote,
  type ComposerGridState,
} from 'lab13-sdk'
import { PortIndependentStorage } from './storage.js'

class MusicComposer {
  private static readonly LOWEST_NOTE = 'H'.charCodeAt(0) // ASCII 72
  private static readonly HIGHEST_NOTE = 'z'.charCodeAt(0) // ASCII 122
  private static readonly NOTE_RANGE = MusicComposer.HIGHEST_NOTE - MusicComposer.LOWEST_NOTE + 1 // 51 rows

  private grid: ComposerGridState = []
  private gridSize = { rows: MusicComposer.NOTE_RANGE, cols: 64 }
  private isPlaying = false
  private player: ReturnType<typeof createGridPlayer> | null = null
  private dragState: { isDragging: boolean; startCell: { row: number; col: number } | null } = {
    isDragging: false,
    startCell: null,
  }
  private lastPlayedCell: { row: number; col: number } | null = null
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
            note: null,
            frequency: null,
            isActive: false,
          }))
      )
  }

  private setupEventListeners() {
    const playBtn = document.getElementById('playBtn')!
    const stopBtn = document.getElementById('stopBtn')!
    const clearBtn = document.getElementById('clearBtn')!

    playBtn.addEventListener('click', () => this.play())
    stopBtn.addEventListener('click', () => this.stop())
    clearBtn.addEventListener('click', () => this.clear())

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

        if (this.grid[row][col].note) {
          cell.classList.add('note')
          cell.textContent = this.grid[row][col].note!
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
    // Just play preview sound, don't commit yet
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
    if (!this.dragState.isDragging) return

    // Commit the note change at the current cell
    this.toggleCell(row, col)

    this.dragState.isDragging = false
    this.dragState.startCell = null
    this.lastPlayedCell = null
  }

  private toggleCell(row: number, col: number) {
    const cell = this.grid[row][col]
    if (cell.note) {
      // Remove note
      cell.note = null
      cell.frequency = null
    } else {
      // Add note
      const note = String.fromCharCode(MusicComposer.HIGHEST_NOTE - row)
      cell.note = note
      cell.frequency = noteToFrequency(note)
    }
    this.renderGrid()
    this.updateOutput()
    this.saveToStorage()
  }

  private playNote(row: number, col: number) {
    const cell = this.grid[row][col]
    let frequency: number

    if (cell.frequency) {
      // Use existing frequency if note is already in cell
      frequency = cell.frequency
    } else {
      // Calculate frequency for preview when no note exists yet
      const note = String.fromCharCode(MusicComposer.HIGHEST_NOTE - row)
      frequency = noteToFrequency(note)
    }

    playSingleNote(this.audioContext, frequency, this.audioContext.currentTime, {
      noteLengthMs: 200,
      volume: 0.1,
    })
  }

  private play() {
    if (this.isPlaying) return

    if (!this.hasNotesInGrid()) {
      this.updateStatus('No notes to play')
      return
    }

    this.isPlaying = true
    this.updateStatus('Playing...')

    this.player = createGridPlayer()
    const playerGrid = compressForPlayer(this.grid)
    this.player.play(playerGrid, {
      noteLengthMs: 200,
      loop: true,
      volume: 0.1,
      onNotePlayed: (row: number, col: number) => this.onNotePlayed(row, col),
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

  private onNotePlayed(row: number, col: number) {
    const cellKey = `${row},${col}`
    this.throbbingCells.add(cellKey)
    this.renderGrid()

    // Remove the throb after animation
    setTimeout(() => {
      this.throbbingCells.delete(cellKey)
      this.renderGrid()
    }, 200)
  }

  private hasNotesInGrid(): boolean {
    for (let row = 0; row < this.gridSize.rows; row++) {
      for (let col = 0; col < this.gridSize.cols; col++) {
        if (this.grid[row][col].note) {
          return true
        }
      }
    }
    return false
  }

  private saveToStorage() {
    try {
      // Save the raw grid state
      const gridData = this.grid.map((row) =>
        row.map((cell) => ({
          note: cell.note,
          frequency: cell.frequency,
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
          this.grid[row][col].note = cellData.note
          this.grid[row][col].frequency = cellData.frequency
          // Don't restore isActive state - it should always start as false
        }
      }
    }
  }

  private updateOutput() {
    const output = document.getElementById('output')!
    const song = compress(this.grid)

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
