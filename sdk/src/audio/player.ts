export type Part = string
export type Song = Part[]

export type MusicPlayerOptions = {
  noteLengthMs: number
  loop?: boolean
  volume?: number
  baseNote?: string // Configurable base note (default 'i' = A4)
  onNotesPlayed?: (col: number) => void // New callback signature
}

export const noteToFrequency = (note: string, baseNote: string = 'i', baseFreq: number = 440) =>
  note === '0' ? 0 : baseFreq * Math.pow(2, (-baseNote.charCodeAt(0) + note.charCodeAt(0)) / 12)

export const playSingleNote = (
  audioContext: AudioContext,
  frequency: number,
  start: number,
  options?: { noteLengthMs?: number; volume?: number }
) => {
  const { noteLengthMs = 200, volume = 0.1 } = options || {}

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

  // Envelope: attack to 0.5, then decay to 0.001
  gainNode.gain.setValueAtTime(volume, start)
  envelope.gain.setValueAtTime(0.5, start)
  envelope.gain.setTargetAtTime(0.001, start + 0.1, 0.05)

  const noteLengthSeconds = noteLengthMs / 1000
  oscillator.start(start)
  oscillator.stop(start + noteLengthSeconds - 0.01)
}

export const createSongPlayer = (song: Song) => {
  let audioContext: AudioContext
  let loopInterval: NodeJS.Timeout
  let currentTime = 0
  const timeoutIds: Set<NodeJS.Timeout> = new Set()

  const play = (options?: Partial<MusicPlayerOptions>) => {
    const { noteLengthMs = 200, loop = true, volume = 0.1, baseNote = 'i', onNotesPlayed } = { ...options }

    const noteLengthSeconds = noteLengthMs / 1000
    const maxCols = Math.max(...song.map((part) => part.length))
    const totalDurationSeconds = maxCols * noteLengthSeconds

    audioContext = audioContext || new AudioContext()
    currentTime = audioContext.currentTime

    const playOnce = () => {
      console.log('Playing song', song, 'starting at', currentTime)

      // Play each time step (column)
      for (let col = 0; col < maxCols; col++) {
        const startTime = currentTime + col * noteLengthSeconds

        // Play all notes in this time step
        for (const part of song) {
          const note = part[col]
          if (note && note !== '0') {
            const frequency = noteToFrequency(note, baseNote)
            playSingleNote(audioContext, frequency, startTime, {
              noteLengthMs,
              volume,
            })
          }
        }

        // Call the column callback with proper timing
        if (onNotesPlayed) {
          const timeoutId = setTimeout(() => onNotesPlayed(col), col * noteLengthMs)
          timeoutIds.add(timeoutId)
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
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close()
    }
  }

  return { play, stop }
}

export type MusicPlayer = ReturnType<typeof createSongPlayer>
