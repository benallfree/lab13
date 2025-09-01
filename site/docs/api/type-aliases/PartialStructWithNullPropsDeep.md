# Type Alias: PartialStructWithNullPropsDeep\<T\>

> **PartialStructWithNullPropsDeep**\<`T`\> = \{ \[P in keyof T\]?: T\[P\] extends object ? PartialStructWithNullPropsDeep\<T\[P\]\> \| null : T\[P\] \| null \}

Defined in: [state/merge.ts:5](https://github.com/benallfree/lab13/blob/55b13e2c02a360fdce138b0495c78378f8c063b1/sdk/src/online/state/merge.ts#L5)

## Type Parameters

### T

`T`
