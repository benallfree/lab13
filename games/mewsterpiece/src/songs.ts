/**
 * Musical notation system for part strings:
 * - Frequency calculated as: 440Hz * 1.06^(-105 + charCode)
 * - 'A' (ASCII 65) ≈ 55Hz (A1), 'a' (ASCII 97) ≈ 262Hz (C4)
 * - 'c' (ASCII 99) ≈ 294Hz (D4), 'g' (ASCII 103) ≈ 392Hz (G4)
 * - '0' (zero): Represents silence/rest (no sound)
 * - Each string is a melody line that plays simultaneously with other parts
 * - Example: 'aciif' plays notes a-c-i-i-f, 'G00G' plays G-silence-silence-G
 */
import { createSongPlayer, SongPart } from './player'

const transpose = (part: SongPart, semitones: number) =>
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

export const level1Song = createSongPlayer(['ikmi0kmnk0mnpm0nprn0ui00'])
