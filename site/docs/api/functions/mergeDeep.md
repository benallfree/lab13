# Function: mergeDeep()

> **mergeDeep**\<`T`\>(`target`, `delta`, `deleteNulls`, `parentKey?`): [`PartialStructWithNullPropsDeep`](../type-aliases/PartialStructWithNullPropsDeep.md)\<`T`\>

Defined in: [state/merge.ts:20](https://github.com/benallfree/lab13/blob/bfb1abf3755bb0fffb55fa5a9e7413f31801f1d6/sdk/src/online/state/merge.ts#L20)

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
