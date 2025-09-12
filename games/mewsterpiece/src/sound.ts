export const t = (i, n) => (n - i) / n
export type CreateSoundOptions = {
  lengthMs?: number
  rate?: number
  throttleMs?: number
  defaultVolume?: number
}
export const createSound = (f, options?: Partial<CreateSoundOptions>) => {
  const { lengthMs = 50, rate = 48e3, throttleMs = lengthMs, defaultVolume = 1 } = options || {}
  const bufferSize = (lengthMs / 1000) * rate
  const A = new AudioContext()
  const m = A.createBuffer(1, bufferSize, rate)
  const b = m.getChannelData(0)
  for (let i = bufferSize; i--; ) b[i] = f(i)
  let lastPlay = 0
  const play = (volume = defaultVolume) => {
    const s = A.createBufferSource()
    const g = A.createGain()
    s.buffer = m
    s.connect(g)
    g.connect(A.destination)
    g.gain.value = volume
    s.start()
  }
  return throttleMs > 0
    ? (volume = 1) => {
        const now = Date.now()
        if (now - lastPlay >= throttleMs) {
          play(volume)
          lastPlay = now
        }
      }
    : play
}

export type CreateContinuousSoundOptions = {
  autoStopMs?: number
  volume?: number
}
export const createContinuousSound = (f, options?: Partial<CreateContinuousSoundOptions>) => {
  const { autoStopMs: defaultAutoStopMs = 0, volume: defaultVolume = 0.1 } = options || {}
  const A = new AudioContext()
  let playing = false
  let volume = 0.1
  let timeoutId
  let counter = 0
  const g = A.createGain()
  g.connect(A.destination)
  const play = (vol = defaultVolume, autoStopMs = defaultAutoStopMs) => {
    volume = vol
    g.gain.value = volume
    if (playing) {
      if (autoStopMs) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => (playing = false), autoStopMs)
      }
      return
    }
    playing = true
    counter = 0
    const loop = () => {
      if (!playing) return
      const s = A.createBufferSource()
      const m = A.createBuffer(1, 1024, A.sampleRate)
      const b = m.getChannelData(0)
      for (let i = 1024; i--; ) b[i] = f(counter++)
      s.buffer = m
      s.connect(g)
      s.onended = loop
      s.start()
    }
    loop()
    if (autoStopMs) {
      timeoutId = setTimeout(() => (playing = false), autoStopMs)
    }
  }
  return {
    start: play,
    stop: () => {
      playing = false
      clearTimeout(timeoutId)
    },
    volume: (vol) => {
      volume = vol
      g.gain.value = volume
    },
  }
}
