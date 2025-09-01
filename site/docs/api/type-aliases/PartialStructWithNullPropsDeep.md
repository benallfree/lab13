# Type Alias: PartialStructWithNullPropsDeep\<T\>

> **PartialStructWithNullPropsDeep**\<`T`\> = \{ \[P in keyof T\]?: T\[P\] extends object ? PartialStructWithNullPropsDeep\<T\[P\]\> \| null : T\[P\] \| null \}

Defined in: [state/merge.ts:5](https://github.com/benallfree/lab13/blob/c14b6cbe39823dfc265f5d26450ed040a344e64f/sdk/src/online/state/merge.ts#L5)

## Type Parameters

### T

`T`
