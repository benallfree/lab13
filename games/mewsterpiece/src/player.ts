export type MusicPlayerOptions = {
  noteLengthMs: number
  loop?: boolean
  volume?: number
}

const A4 = 440
const A4_CHAR = 'i'.charCodeAt(0)
export const toFrequencyArray = (part: SongPart) =>
  part.split('').map((note) => (note === '0' ? 0 : A4 * Math.pow(1.062, -A4_CHAR + note.charCodeAt(0))))

export type FrequencyArray = number[]
export type SongPart = string
export type Song = SongPart[]
export const createPartPlayer = (frequencyArray: FrequencyArray, factoryOptions?: Partial<MusicPlayerOptions>) => {
  if (!frequencyArray) return { play: () => {}, stop: () => {} } // Early exit if no melody

  let audioContext: AudioContext
  let G: GainNode
  let loopInterval: NodeJS.Timeout
  let isPlaying = false
  let currentTime = 0

  const play = (options?: Partial<MusicPlayerOptions>) => {
    const { noteLengthMs = 300, loop = false, volume = 0.2 } = { ...factoryOptions, ...options }
    if (isPlaying) return

    isPlaying = true
    const noteLengthSeconds = noteLengthMs / 1000
    const totalDurationSeconds = frequencyArray.length * noteLengthSeconds

    audioContext = new AudioContext()
    G = audioContext.createGain()
    G.gain.value = volume
    currentTime = audioContext.currentTime + 0.3

    const playOnce = () => {
      console.log('Playing part', frequencyArray, 'starting at', currentTime)

      for (let i = 0; i < frequencyArray.length; i++) {
        const frequency = frequencyArray[i]
        const oscillator = audioContext.createOscillator()
        if (frequency === 0) continue

        oscillator.connect(G)
        G.connect(audioContext.destination)

        const startTime = currentTime + i * noteLengthSeconds
        oscillator.start(startTime)

        // Calculate frequency: 440Hz * 1.06^(-105 + charCode)
        oscillator.frequency.setValueAtTime(frequency, startTime)

        oscillator.type = 'sine' // or triangle, square, sawtooth

        // Envelope: attack to 0.5, then decay to 0.001
        const gain = audioContext.createGain()
        oscillator.connect(gain)
        gain.connect(G)
        gain.gain.setValueAtTime(0.5, startTime)
        gain.gain.setTargetAtTime(0.001, startTime + 0.1, 0.05)

        oscillator.stop(startTime + noteLengthSeconds - 0.01)
      }

      // Update currentTime for next iteration
      currentTime += totalDurationSeconds
    }

    playOnce()

    if (loop) {
      loopInterval = setInterval(() => {
        playOnce()
      }, totalDurationSeconds * 1000)
    }
  }

  const stop = () => {
    if (!isPlaying) return
    isPlaying = false
    if (loopInterval) {
      clearInterval(loopInterval)
    }
  }

  return { play, stop }
}

export const createSongPlayer = (song: Song, factoryOptions?: Partial<MusicPlayerOptions>) => {
  const maxLen = Math.max(...song.map((p) => p.length))
  const normalizedParts = song.map((p) => p.padEnd(maxLen, '0')).map(toFrequencyArray)

  let partPlayers: ReturnType<typeof createPartPlayer>[] = []
  let isPlaying = false

  const start = (options?: Partial<MusicPlayerOptions>) => {
    const { noteLengthMs = 300, loop = true, volume = 0.025 } = { ...factoryOptions, ...options }
    if (isPlaying) return
    isPlaying = true

    partPlayers = normalizedParts.map((part) => createPartPlayer(part, { noteLengthMs, loop, volume }))
    partPlayers.forEach((player) => player.play())
  }

  const stop = () => {
    if (!isPlaying) return
    isPlaying = false
    partPlayers.forEach((player) => player.stop())
    partPlayers = []
  }

  return { start, stop }
}
