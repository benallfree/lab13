import { PRIVATE_KEY_PREFIX } from './merge'

// Utility function to filter out private keys from state/delta objects

export const filterPrivateKeys = <T extends Record<string, any>>(obj: T): T => {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  const filtered = { ...obj } as any

  // Filter out any keys that start with the private key prefix
  Object.keys(filtered).forEach((key) => {
    if (key.startsWith(PRIVATE_KEY_PREFIX)) {
      delete filtered[key]
    } else if (typeof filtered[key] === 'object' && filtered[key] !== null) {
      // Recursively filter nested objects
      filtered[key] = filterPrivateKeys(filtered[key])
    }
  })

  return filtered as T
}
