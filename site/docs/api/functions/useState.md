# Function: useState()

> **useState**\<`TStateShape`\>(`options?`): `object`

Defined in: [state/index.ts:57](https://github.com/benallfree/lab13/blob/c14b6cbe39823dfc265f5d26450ed040a344e64f/sdk/src/online/state/index.ts#L57)

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

### getPlayerState()

> **getPlayerState**: (`clientId`, `copy`) => `null` \| [`PartialDeep`](../type-aliases/PartialDeep.md)\<`TStateShape`\[`"@players"`\]\[`string`\]\>

#### Parameters

##### clientId

`string`

##### copy

`boolean` = `false`

#### Returns

`null` \| [`PartialDeep`](../type-aliases/PartialDeep.md)\<`TStateShape`\[`"@players"`\]\[`string`\]\>

### getPlayerStates()

> **getPlayerStates**: (`copy`) => [`PartialDeep`](../type-aliases/PartialDeep.md)\<`TStateShape`\[[`PlayerEntityCollectionKey`](../type-aliases/PlayerEntityCollectionKey.md)\]\>

#### Parameters

##### copy

`boolean` = `false`

#### Returns

[`PartialDeep`](../type-aliases/PartialDeep.md)\<`TStateShape`\[[`PlayerEntityCollectionKey`](../type-aliases/PlayerEntityCollectionKey.md)\]\>

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
