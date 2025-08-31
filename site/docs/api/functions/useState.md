# Function: useState()

> **useState**\<`TStateShape`\>(`options?`): `object`

Defined in: [state/index.ts:57](https://github.com/benallfree/lab13/blob/9ac0af7da9640b4b5437ad34793eec1f82ae6b92/sdk/src/online/state/index.ts#L57)

## Type Parameters

### TStateShape

`TStateShape` *extends* [`StateBase`](../type-aliases/StateBase.md)\<`Record`\<`string`, `any`\>\>

## Parameters

### options?

`Partial`\<[`StateOptions`](../type-aliases/StateOptions.md)\<`TStateShape`\>\>

## Returns

`object`

### getMyState()

> **getMyState**: (`copy`) => `null` \| [`PartialDeep`](../type-aliases/PartialDeep.md)\<`TStateShape`\[`"@players"`\]\[`string`\]\>

#### Parameters

##### copy

`boolean` = `false`

#### Returns

`null` \| [`PartialDeep`](../type-aliases/PartialDeep.md)\<`TStateShape`\[`"@players"`\]\[`string`\]\>

### getState()

> **getState**: (`copy`) => [`PartialDeep`](../type-aliases/PartialDeep.md)\<`TStateShape`\>

#### Parameters

##### copy

`boolean` = `false`

#### Returns

[`PartialDeep`](../type-aliases/PartialDeep.md)\<`TStateShape`\>

### updateMyState()

> **updateMyState**: (`delta`) => `void`

#### Parameters

##### delta

[`PartialStructWithNullPropsDeep`](../type-aliases/PartialStructWithNullPropsDeep.md)\<`TStateShape`\[[`PlayerEntityCollectionKey`](../type-aliases/PlayerEntityCollectionKey.md)\]\[`string`\]\>

#### Returns

`void`

### updatePlayerState()

> **updatePlayerState**: (`clientId`, `delta`) => `void`

#### Parameters

##### clientId

`string`

##### delta

`null` | [`PartialStructWithNullPropsDeep`](../type-aliases/PartialStructWithNullPropsDeep.md)\<`TStateShape`\[`"@players"`\]\[`string`\]\>

#### Returns

`void`

### updateState()

> **updateState**: (`delta`, `send`) => `void`

#### Parameters

##### delta

[`PartialStructWithNullPropsDeep`](../type-aliases/PartialStructWithNullPropsDeep.md)\<`TStateShape`\>

##### send

`boolean` = `true`

#### Returns

`void`
