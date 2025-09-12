import type { PlayerGridCell, PlayerGridState } from './compress.js'

export type MusicPlayerOptions = {
  noteLengthMs: number
  loop?: boolean
  volume?: number
  onNotePlayed?: (row: number, col: number) => void
}

const A4 = 440
const A4_CHAR = 'i'.charCodeAt(0)

export const noteToFrequency = (note: string) =>
  note === '0' ? 0 : A4 * Math.pow(2, (-A4_CHAR + note.charCodeAt(0)) / 12)

export const frequencyToNote = (frequency: number): string => {
  if (frequency === 0) return '0'
  const noteIndex = Math.round((12 * Math.log(frequency / A4)) / Math.log(2) + A4_CHAR)
  return String.fromCharCode(noteIndex)
}

export const playSingleNote = (
  audioContext: AudioContext,
  frequencyOrNote: number | string,
  start: number,
  options?: { noteLengthMs?: number; volume?: number }
) => {
  const { noteLengthMs = 200, volume = 0.1 } = options || {}

  const frequency = typeof frequencyOrNote === 'string' ? noteToFrequency(frequencyOrNote) : frequencyOrNote
  // console.log('Playing note', frequency, 'at', start)
  if (frequency === 0) return

  const ctx = audioContext
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  const envelope = ctx.createGain()

  oscillator.connect(envelope)
  envelope.connect(gainNode)

  gainNode.connect(ctx.destination)

  oscillator.frequency.setValueAtTime(frequency, start)
  oscillator.type = 'sine'

  // Same envelope as player: attack to 0.5, then decay to 0.001
  gainNode.gain.setValueAtTime(volume, start)
  envelope.gain.setValueAtTime(0.5, start)
  envelope.gain.setTargetAtTime(0.001, start + 0.1, 0.05)

  const noteLengthSeconds = noteLengthMs / 1000
  oscillator.start(start)
  oscillator.stop(start + noteLengthSeconds - 0.01)
  console.log('Playing note', frequency, 'at', start)
}

export const createGridPlayer = () => {
  let audioContext: AudioContext
  let loopInterval: NodeJS.Timeout
  let currentTime = 0
  const timeoutIds: Set<NodeJS.Timeout> = new Set()

  const play = (grid: PlayerGridState, options?: Partial<MusicPlayerOptions>) => {
    const { noteLengthMs = 200, loop = true, volume = 0.1, onNotePlayed } = { ...options }

    const noteLengthSeconds = noteLengthMs / 1000
    const maxCols = findMaxColumns(grid)
    const totalDurationSeconds = maxCols * noteLengthSeconds

    audioContext = audioContext || new AudioContext()
    currentTime = audioContext.currentTime

    const playOnce = () => {
      console.log('Playing grid', grid, 'starting at', currentTime)

      for (let col = 0; col < maxCols; col++) {
        for (let row = 0; row < grid.length; row++) {
          const cell = grid[row]?.[col] as PlayerGridCell
          if (!cell.frequency) continue
          const startTime = currentTime + col * noteLengthSeconds

          // Call the note played callback with proper timing
          if (onNotePlayed) {
            const timeoutId = setTimeout(() => onNotePlayed(row, col), col * noteLengthMs)
            timeoutIds.add(timeoutId)
          }

          playSingleNote(audioContext, cell.frequency, startTime, {
            noteLengthMs,
            volume,
          })
        }
      }

      // Update currentTime for next iteration
      currentTime += totalDurationSeconds
    }

    playOnce()

    if (loop) {
      loopInterval = setInterval(playOnce, totalDurationSeconds * 1000)
    }
  }

  const stop = () => {
    timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId))
    timeoutIds.clear()
    if (loopInterval) {
      clearInterval(loopInterval)
    }
    // Stop immediately by closing the audio context
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close()
    }
  }

  return { play, stop }
}

const findMaxColumns = (grid: PlayerGridState): number => {
  let maxCol = 0
  for (let row = 0; row < grid.length; row++) {
    const rowData = grid[row]
    if (!rowData) continue

    for (let col = rowData.length - 1; col >= 0; col--) {
      const cell = rowData[col]
      if (cell && cell.frequency) {
        maxCol = Math.max(maxCol, col + 1)
        break
      }
    }
  }
  return Math.max(1, maxCol)
}
