# Type Alias: PartialDeep\<T\>

> **PartialDeep**\<`T`\> = `{ [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P] }`

Defined in: [state/merge.ts:1](https://github.com/benallfree/lab13/blob/c14b6cbe39823dfc265f5d26450ed040a344e64f/sdk/src/online/state/merge.ts#L1)

## Type Parameters

### T

`T`
