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
    return this.compressFromGrid(this.grid, baseNote)
  }

  // Compress any grid to a Song
  private compressFromGrid(grid: ComposerGridState, baseNote: string = 'i'): Song {
    const song: string[] = []
    const maxCols = grid[0]?.length || this.gridSize.cols
    const baseNoteCode = baseNote.charCodeAt(0)

    // Step 1: Copy the grid
    const gridCopy: ComposerGridState = grid.map((row) => row.map((cell) => ({ ...cell })))

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
    const shareBtn = document.getElementById('shareBtn')
    const importBtn = document.getElementById('importBtn')

    playBtn.addEventListener('click', () => this.play())
    stopBtn.addEventListener('click', () => this.stop())
    clearBtn.addEventListener('click', () => this.clear())
    if (shareBtn) {
      shareBtn.addEventListener('click', () => this.shareSong())
    }
    if (importBtn) {
      importBtn.addEventListener('click', () => this.showImportModal())
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

    // Play the cell note
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

    // Check if it's the same cell
    if (startRow === row && startCol === col) {
      // Same cell: toggle the note (remove if occupied, add if empty)
      this.grid[row][col].occupied = !this.grid[row][col].occupied
    } else {
      // Different cell: commit to the current cell and remove from start cell
      this.grid[row][col].occupied = true
      this.grid[startRow][startCol].occupied = false
    }

    this.renderGrid()
    this.updateOutput()
    this.saveToStorage()

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

    // Create shifted grid based on playhead position
    const shiftedGrid = this.createShiftedGrid()
    const song = this.compressFromGrid(shiftedGrid)
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

  private shareSong() {
    const song = this.compress()
    const songJson = JSON.stringify(song)

    // Copy to clipboard
    navigator.clipboard
      .writeText(songJson)
      .then(() => {
        this.updateStatus('Song copied to clipboard!')
      })
      .catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = songJson
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        this.updateStatus('Song copied to clipboard!')
      })

    // Show modal with the data
    this.showShareModal(songJson)
  }

  private showShareModal(songJson: string) {
    // Create modal
    const modal = document.createElement('div')
    modal.className = 'modal'
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Share Song</h3>
        <p>Your song has been copied to the clipboard! You can also copy it from below:</p>
        <textarea id="shareTextarea" readonly rows="6" cols="50">${songJson}</textarea>
        <div class="modal-buttons">
          <button id="shareCopy">Copy Again</button>
          <button id="shareClose">Close</button>
        </div>
      </div>
    `

    // Add modal styles (reuse existing styles)
    const style = document.createElement('style')
    style.textContent = `
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      .modal-content {
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
      }
      .modal-content h3 {
        margin-top: 0;
        color: #333;
      }
      .modal-content p {
        color: #666;
        margin-bottom: 15px;
      }
      .modal-content textarea {
        width: 100%;
        margin: 10px 0;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-family: monospace;
        background: #f8f8f8;
      }
      .modal-buttons {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 15px;
      }
      .modal-buttons button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .modal-buttons button:first-child {
        background: #007bff;
        color: white;
      }
      .modal-buttons button:last-child {
        background: #6c757d;
        color: white;
      }
    `
    document.head.appendChild(style)
    document.body.appendChild(modal)

    // Focus and select the textarea
    const textarea = modal.querySelector('#shareTextarea') as HTMLTextAreaElement
    textarea.focus()
    textarea.select()

    // Event listeners
    modal.querySelector('#shareCopy')!.addEventListener('click', () => {
      textarea.select()
      navigator.clipboard
        .writeText(songJson)
        .then(() => {
          this.updateStatus('Song copied to clipboard again!')
        })
        .catch(() => {
          document.execCommand('copy')
          this.updateStatus('Song copied to clipboard again!')
        })
    })

    modal.querySelector('#shareClose')!.addEventListener('click', () => {
      this.closeModal(modal, style)
    })

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal, style)
      }
    })

    // Handle keyboard shortcuts
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeModal(modal, style)
        document.removeEventListener('keydown', handleKeydown)
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        // Cmd-A or Ctrl-A: select all text in the textarea
        e.preventDefault()
        textarea.select()
      }
    }
    document.addEventListener('keydown', handleKeydown)
  }

  private showImportModal() {
    // Create modal
    const modal = document.createElement('div')
    modal.className = 'modal'
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Import Song</h3>
        <p>Paste the shared song content below:</p>
        <textarea id="importTextarea" placeholder='Paste song array (e.g., ["ace", "bd"])' rows="4" cols="50"></textarea>
        <div class="modal-buttons">
          <button id="importConfirm">Import</button>
          <button id="importCancel">Cancel</button>
        </div>
      </div>
    `

    // Add modal styles
    const style = document.createElement('style')
    style.textContent = `
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      .modal-content {
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
      }
      .modal-content h3 {
        margin-top: 0;
      }
      .modal-content textarea {
        width: 100%;
        margin: 10px 0;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-family: monospace;
      }
      .modal-buttons {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 15px;
      }
      .modal-buttons button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .modal-buttons button:first-child {
        background: #007bff;
        color: white;
      }
      .modal-buttons button:last-child {
        background: #6c757d;
        color: white;
      }
    `
    document.head.appendChild(style)
    document.body.appendChild(modal)

    // Focus textarea
    const textarea = modal.querySelector('#importTextarea') as HTMLTextAreaElement
    textarea.focus()

    // Event listeners
    modal.querySelector('#importConfirm')!.addEventListener('click', () => {
      const input = textarea.value.trim()
      if (!input) return

      try {
        const song = JSON.parse(input)
        if (Array.isArray(song) && song.every((part) => typeof part === 'string')) {
          this.importSong(song)
          this.closeModal(modal, style)
        } else {
          this.updateStatus('Invalid song format. Expected array of strings.')
        }
      } catch (error) {
        this.updateStatus('Invalid JSON format.')
      }
    })

    modal.querySelector('#importCancel')!.addEventListener('click', () => {
      this.closeModal(modal, style)
    })

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal, style)
      }
    })

    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeModal(modal, style)
        document.removeEventListener('keydown', handleEscape)
      }
    }
    document.addEventListener('keydown', handleEscape)
  }

  private closeModal(modal: HTMLElement, style: HTMLElement) {
    document.body.removeChild(modal)
    document.head.removeChild(style)
  }

  private onNotesPlayed(col: number) {
    // Map the shifted grid column back to the original grid column
    const originalCol = this.mapShiftedColumnToOriginal(col)

    // Highlight all notes in this column
    for (let row = 0; row < this.gridSize.rows; row++) {
      if (this.grid[row][originalCol].occupied) {
        const cellKey = `${row},${originalCol}`
        this.throbbingCells.add(cellKey)
      }
    }
    this.renderGrid()

    // Remove the throb after animation
    setTimeout(() => {
      for (let row = 0; row < this.gridSize.rows; row++) {
        if (this.grid[row][originalCol].occupied) {
          const cellKey = `${row},${originalCol}`
          this.throbbingCells.delete(cellKey)
        }
      }
      this.renderGrid()
    }, 200)
  }

  private mapShiftedColumnToOriginal(shiftedCol: number): number {
    // Find the highest grid column containing a note
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

    if (highestCol === -1) return shiftedCol

    // Map shifted column back to original column
    if (shiftedCol < highestCol - this.playheadPosition + 1) {
      // This is from the playhead to highest column section
      return this.playheadPosition + shiftedCol
    } else {
      // This is from the wrapped section (1st column to playhead)
      const wrappedCol = shiftedCol - (highestCol - this.playheadPosition + 1)
      return wrappedCol
    }
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
      } else {
        // Load default song if no data in storage
        this.loadDefaultSong()
      }
    } catch (error) {
      console.warn('Could not load from storage:', error)
      // Load default song on error
      this.loadDefaultSong()
    }
  }

  private loadDefaultSong() {
    const defaultSong: Song = [
      'll0n0j0jYll00uYvusqs[p0pp00qpnlj0n0q00l0^p00s000v0u0s0pq',
      'ii0j0e0e00i00q000Y^0T00dd000000g0j0n00]00`0000000000d0d',
      '0Y0^000000Y000000000000``000000[0^0]0000000000000000`0`',
    ]
    this.importSong(defaultSong)
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
