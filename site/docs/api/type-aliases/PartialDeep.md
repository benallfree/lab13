# Type Alias: PartialDeep\<T\>

> **PartialDeep**\<`T`\> = `{ [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P] }`

Defined in: [state/merge.ts:1](https://github.com/benallfree/lab13/blob/bfb1abf3755bb0fffb55fa5a9e7413f31801f1d6/sdk/src/online/state/merge.ts#L1)

## Type Parameters

### T

`T`
