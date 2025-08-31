# Type Alias: PartialDeep\<T\>

> **PartialDeep**\<`T`\> = `{ [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P] }`

Defined in: [state/merge.ts:1](https://github.com/benallfree/lab13/blob/9ac0af7da9640b4b5437ad34793eec1f82ae6b92/sdk/src/online/state/merge.ts#L1)

## Type Parameters

### T

`T`
