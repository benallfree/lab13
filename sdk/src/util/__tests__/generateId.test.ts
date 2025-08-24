import { describe, expect, test } from 'bun:test'
import { generateId } from '../generateId'

describe('generateId', () => {
  test('should generate a string', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
  })

  test('should generate 14 character IDs', () => {
    const id = generateId()
    expect(id.length).toBe(14)
  })

  test('should generate unique IDs', () => {
    const ids = new Set()
    const iterations = 1000

    for (let i = 0; i < iterations; i++) {
      const id = generateId()
      expect(ids.has(id)).toBe(false)
      ids.add(id)
    }

    expect(ids.size).toBe(iterations)
  })

  test('should generate alphanumeric IDs', () => {
    const id = generateId()
    expect(id).toMatch(/^[a-z0-9]{14}$/)
  })

  test('should generate different IDs on subsequent calls', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })

  test('should generate IDs with consistent format', () => {
    const ids = Array.from({ length: 100 }, () => generateId())

    // All IDs should be 14 characters
    ids.forEach((id) => {
      expect(id.length).toBe(14)
    })

    // All IDs should be alphanumeric
    ids.forEach((id) => {
      expect(id).toMatch(/^[a-z0-9]{14}$/)
    })
  })

  test('should handle rapid successive calls', () => {
    const ids = []
    const start = Date.now()

    // Generate 1000 IDs rapidly
    for (let i = 0; i < 1000; i++) {
      ids.push(generateId())
    }

    const end = Date.now()
    const duration = end - start

    // Should complete quickly (less than 100ms)
    expect(duration).toBeLessThan(100)

    // All should be unique
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(1000)
  })

  test('should generate IDs with time-based component', () => {
    const id1 = generateId()

    // Wait a bit to ensure time difference
    Bun.sleep(1)

    const id2 = generateId()

    // IDs should be different due to time component
    expect(id1).not.toBe(id2)
  })

  test('should handle concurrent generation', async () => {
    const promises = Array.from({ length: 100 }, () => Promise.resolve(generateId()))

    const ids = await Promise.all(promises)
    const uniqueIds = new Set(ids)

    expect(uniqueIds.size).toBe(100)
  })

  test('should generate IDs with expected character distribution', () => {
    const ids = Array.from({ length: 1000 }, () => generateId())
    const allChars = ids.join('')

    // Should contain both letters and numbers
    expect(allChars).toMatch(/[a-z]/)
    expect(allChars).toMatch(/[0-9]/)
  })

  test('should not generate sequential patterns', () => {
    const ids = Array.from({ length: 100 }, () => generateId())

    // Check that we don't have obvious sequential patterns
    for (let i = 1; i < ids.length; i++) {
      expect(ids[i]).not.toBe(ids[i - 1])
    }
  })
})
