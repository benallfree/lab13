export type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P]
}

export type PartialStructWithNullPropsDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialStructWithNullPropsDeep<T[P]> | null : T[P] | null
}

export const PRIVATE_KEY_PREFIX = '_'
export type PrivateKeyPrefix = typeof PRIVATE_KEY_PREFIX
export type PrivateKey = `${PrivateKeyPrefix}${string}`
export const PRIVATE_KEY_COLLECTION_KEY: PrivateKey = `${PRIVATE_KEY_PREFIX}keys`

export const ENTITY_COLLECTION_PREFIX = '@'
export type EntityCollectionPrefix = typeof ENTITY_COLLECTION_PREFIX
export type EntityCollectionKey = `${EntityCollectionPrefix}${string}`
export type PlayerEntityCollectionKey = `${EntityCollectionPrefix}players`
export const PLAYER_ENTITY_COLLECTION_KEY: PlayerEntityCollectionKey = `${ENTITY_COLLECTION_PREFIX}players`
const tombstones = new Set<string>()
export function mergeDeep<T extends Record<string, any>>(
  target: T,
  delta: PartialStructWithNullPropsDeep<T>,
  deleteNulls = false,
  parentKey?: string
): PartialStructWithNullPropsDeep<T> {
  const changes: any = {}

  const deleteKey = (key: string) => {
    if (deleteNulls) {
      delete target[key]
    } else {
      target[key as keyof T] = null as any
    }
    changes[key] = null as any
    if (parentKey?.startsWith(ENTITY_COLLECTION_PREFIX)) {
      tombstones.add(key)
    }
  }

  const isTombstoned = (key: string) => parentKey?.startsWith(ENTITY_COLLECTION_PREFIX) && tombstones.has(key)

  Object.keys(delta).forEach((key) => {
    if (isTombstoned(key)) {
      deleteKey(key)
      return
    }

    const deltaValue = delta[key]
    const targetValue = target[key]

    if (deltaValue === null) {
      deleteKey(key)
    } else if (
      deltaValue &&
      typeof deltaValue === 'object' &&
      !Array.isArray(deltaValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      const nestedChanges = mergeDeep(targetValue, deltaValue, deleteNulls, key)
      if (Object.keys(nestedChanges).length > 0) {
        changes[key] = nestedChanges as any
      }
    } else if (deltaValue !== targetValue) {
      target[key as keyof T] = deltaValue as any
      changes[key] = deltaValue
    }
  })
  return changes
}
