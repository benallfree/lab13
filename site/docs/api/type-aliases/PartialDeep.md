# Type Alias: PartialDeep\<T\>

> **PartialDeep**\<`T`\> = `{ [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P] }`

Defined in: [state/merge.ts:1](https://github.com/benallfree/lab13/blob/55b13e2c02a360fdce138b0495c78378f8c063b1/sdk/src/online/state/merge.ts#L1)

## Type Parameters

### T

`T`
