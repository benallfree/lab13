# Function: createMyStateCopier()

> **createMyStateCopier**(`myIdGetter`): \<`TStateShape`\>(`currentState`, `newState`) => [`PartialDeep`](../type-aliases/PartialDeep.md)\<`TStateShape`\>

Defined in: [state/copier.ts:5](https://github.com/benallfree/lab13/blob/9ac0af7da9640b4b5437ad34793eec1f82ae6b92/sdk/src/online/state/copier.ts#L5)

## Parameters

### myIdGetter

() => `null` \| `string`

## Returns

> \<`TStateShape`\>(`currentState`, `newState`): [`PartialDeep`](../type-aliases/PartialDeep.md)\<`TStateShape`\>

### Type Parameters

#### TStateShape

`TStateShape` *extends* [`StateBase`](../type-aliases/StateBase.md)

### Parameters

#### currentState

[`PartialDeep`](../type-aliases/PartialDeep.md)\<`TStateShape`\>

#### newState

[`PartialDeep`](../type-aliases/PartialDeep.md)\<`TStateShape`\>

### Returns

[`PartialDeep`](../type-aliases/PartialDeep.md)\<`TStateShape`\>
