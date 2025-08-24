import { describe, expect, test } from 'bun:test'
import { deepMerge } from '../deepMerge'

describe('deepMerge', () => {
  test('should merge simple objects', () => {
    const target = { a: 1, b: 2 }
    const source = { b: 3, c: 4 }
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: 1, b: 3, c: 4 })
    expect(target).toEqual({ a: 1, b: 2 }) // Original should not be mutated
  })

  test('should merge nested objects', () => {
    const target = {
      user: { name: 'John', age: 30 },
      settings: { theme: 'dark' },
    }
    const source = {
      user: { age: 31, email: 'john@example.com' },
      settings: { theme: 'light', notifications: true },
    }
    const result = deepMerge(target, source)

    expect(result).toEqual({
      user: { name: 'John', age: 31, email: 'john@example.com' },
      settings: { theme: 'light', notifications: true },
    })
  })

  test('should handle null values by deleting keys', () => {
    const target = { a: 1, b: 2, c: 3 }
    const source = { b: null, d: 4 }
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: 1, c: 3, d: 4 })
    expect(result.b).toBeUndefined()
  })

  test('should handle deeply nested null values', () => {
    const target = {
      user: { name: 'John', age: 30, preferences: { theme: 'dark', sound: true } },
    }
    const source = {
      user: { age: null, preferences: { theme: null, notifications: false } },
    }
    const result = deepMerge(target, source)

    expect(result).toEqual({
      user: { name: 'John', preferences: { sound: true, notifications: false } },
    })
    expect(result.user.age).toBeUndefined()
    expect(result.user.preferences.theme).toBeUndefined()
  })

  test('should handle arrays (replace them)', () => {
    const target = { items: [1, 2, 3], tags: ['a', 'b'] }
    const source = { items: [4, 5], colors: ['red', 'blue'] }
    const result = deepMerge(target, source)

    expect(result).toEqual({
      items: [4, 5],
      tags: ['a', 'b'],
      colors: ['red', 'blue'],
    })
  })

  test('should handle empty objects', () => {
    const target = {}
    const source = { a: 1, b: 2 }
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: 1, b: 2 })
  })

  test('should handle empty source', () => {
    const target = { a: 1, b: 2 }
    const source = {}
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: 1, b: 2 })
  })

  test('should handle primitive values', () => {
    const target = { a: 1, b: 'hello', c: true }
    const source = { a: 2, b: 'world', c: false, d: 42 }
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: 2, b: 'world', c: false, d: 42 })
  })

  test('should handle complex nested structures', () => {
    const target = {
      game: {
        players: {
          player1: { name: 'Alice', score: 100, inventory: ['sword'] },
          player2: { name: 'Bob', score: 200 },
        },
        settings: { difficulty: 'hard' },
      },
    }
    const source = {
      game: {
        players: {
          player1: { score: 150, inventory: null },
          player3: { name: 'Charlie', score: 300 },
        },
        settings: { difficulty: 'easy', sound: true },
      },
    }
    const result = deepMerge(target, source)

    expect(result).toEqual({
      game: {
        players: {
          player1: { name: 'Alice', score: 150 },
          player2: { name: 'Bob', score: 200 },
          player3: { name: 'Charlie', score: 300 },
        },
        settings: { difficulty: 'easy', sound: true },
      },
    })
    expect(result.game.players.player1.inventory).toBeUndefined()
  })

  test('should handle function signature correctly', () => {
    const target = { a: 1 }
    const source = { b: 2 }
    const result = deepMerge(target, source)

    expect(result).toEqual({ a: 1, b: 2 })
  })

  test('should handle undefined and null source values', () => {
    const target = { a: 1, b: 2 }

    // @ts-ignore - testing edge cases
    const result1 = deepMerge(target, undefined)
    expect(result1).toEqual(target)

    // @ts-ignore - testing edge cases
    const result2 = deepMerge(target, null)
    expect(result2).toEqual(target)
  })

  test('should handle undefined and null target values', () => {
    const source = { a: 1, b: 2 }

    // @ts-ignore - testing edge cases
    const result1 = deepMerge(undefined, source)
    expect(result1).toEqual(source)

    // @ts-ignore - testing edge cases
    const result2 = deepMerge(null, source)
    expect(result2).toEqual(source)
  })
})
