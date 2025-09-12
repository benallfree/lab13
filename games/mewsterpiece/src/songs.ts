/**
 * Musical notation system for part strings:
 * - Frequency calculated as: 440Hz * 1.06^(-105 + charCode)
 * - 'A' (ASCII 65) ≈ 55Hz (A1), 'a' (ASCII 97) ≈ 262Hz (C4)
 * - 'c' (ASCII 99) ≈ 294Hz (D4), 'g' (ASCII 103) ≈ 392Hz (G4)
 * - '0' (zero): Represents silence/rest (no sound)
 * - Each string is a melody line that plays simultaneously with other parts
 * - Example: 'aciif' plays notes a-c-i-i-f, 'G00G' plays G-silence-silence-G
 */

import { createSongPlayer } from 'lab13-sdk'

const transpose = (part: string, semitones: number) =>
  part
    .split('')
    .map((n) => {
      if (n === ' ') return ' '
      let c = n.charCodeAt(0)
      if (c < 33 || c > 126) return ' '
      c += semitones
      if (c < 33 || c > 126) return ' '
      return String.fromCharCode(c)
    })
    .join('')

export const level1Song = createSongPlayer([
  'll0n0j0jYll00uYvusqs[p0pp00qpnlj0n0q00l0^p00s000v0u0s0pq',
  'ii0j0e0e00i00q000Y^0T00dd000000g0j0n00]00`0000000000d0d',
  '0Y0^000000Y000000000000``000000[0^0]0000000000000000`0`',
])
