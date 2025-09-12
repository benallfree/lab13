import { createContinuousSound, createSound, t } from './sound'

export const playWhiteNoiseSound = createContinuousSound(() => Math.random() * 2 - 1)

export const playDrawSound = createSound((i) => (Math.random() * 2 - 1) * Math.exp(-i / 500))

export const playPlopSound = createSound(function (i) {
  var n = 6e3
  if (i > n) return null
  var q = t(i, n)
  return Math.sin(i * 0.01 * Math.sin(0.009 * i + Math.sin(i / 200)) + Math.sin(i / 100)) * q * q
})
