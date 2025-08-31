# Type Alias: PartialStructWithNullPropsDeep\<T\>

> **PartialStructWithNullPropsDeep**\<`T`\> = \{ \[P in keyof T\]?: T\[P\] extends object ? PartialStructWithNullPropsDeep\<T\[P\]\> \| null : T\[P\] \| null \}

Defined in: [state/merge.ts:5](https://github.com/benallfree/lab13/blob/9ac0af7da9640b4b5437ad34793eec1f82ae6b92/sdk/src/online/state/merge.ts#L5)

## Type Parameters

### T

`T`
