# Function: mergeDeep()

> **mergeDeep**\<`T`\>(`target`, `delta`, `deleteNulls`, `parentKey?`): [`PartialStructWithNullPropsDeep`](../type-aliases/PartialStructWithNullPropsDeep.md)\<`T`\>

Defined in: [state/merge.ts:20](https://github.com/benallfree/lab13/blob/c14b6cbe39823dfc265f5d26450ed040a344e64f/sdk/src/online/state/merge.ts#L20)

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `any`\>

## Parameters

### target

`T`

### delta

[`PartialStructWithNullPropsDeep`](../type-aliases/PartialStructWithNullPropsDeep.md)\<`T`\>

### deleteNulls

`boolean` = `false`

### parentKey?

`string`

## Returns

[`PartialStructWithNullPropsDeep`](../type-aliases/PartialStructWithNullPropsDeep.md)\<`T`\>
