# Type Alias: PartialStructWithNullPropsDeep\<T\>

> **PartialStructWithNullPropsDeep**\<`T`\> = \{ \[P in keyof T\]?: T\[P\] extends object ? PartialStructWithNullPropsDeep\<T\[P\]\> \| null : T\[P\] \| null \}

Defined in: [state/merge.ts:5](https://github.com/benallfree/lab13/blob/bfb1abf3755bb0fffb55fa5a9e7413f31801f1d6/sdk/src/online/state/merge.ts#L5)

## Type Parameters

### T

`T`
