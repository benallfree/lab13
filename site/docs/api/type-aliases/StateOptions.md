# Type Alias: StateOptions\<TStateShape\>

> **StateOptions**\<`TStateShape`\> = `object`

Defined in: [state/index.ts:46](https://github.com/benallfree/lab13/blob/9ac0af7da9640b4b5437ad34793eec1f82ae6b92/sdk/src/online/state/index.ts#L46)

## Type Parameters

### TStateShape

`TStateShape` *extends* [`StateBase`](StateBase.md)

## Properties

### deltaThrottleMs?

> `optional` **deltaThrottleMs**: `number`

Defined in: [state/index.ts:55](https://github.com/benallfree/lab13/blob/9ac0af7da9640b4b5437ad34793eec1f82ae6b92/sdk/src/online/state/index.ts#L55)

***

### onBeforeSendDelta()?

> `optional` **onBeforeSendDelta**: (`delta`) => [`StateDelta`](StateDelta.md)\<`TStateShape`\>

Defined in: [state/index.ts:52](https://github.com/benallfree/lab13/blob/9ac0af7da9640b4b5437ad34793eec1f82ae6b92/sdk/src/online/state/index.ts#L52)

#### Parameters

##### delta

[`StateDelta`](StateDelta.md)\<`TStateShape`\>

#### Returns

[`StateDelta`](StateDelta.md)\<`TStateShape`\>

***

### onBeforeSendState()?

> `optional` **onBeforeSendState**: (`state`) => [`PartialDeep`](PartialDeep.md)\<`TStateShape`\>

Defined in: [state/index.ts:47](https://github.com/benallfree/lab13/blob/9ac0af7da9640b4b5437ad34793eec1f82ae6b92/sdk/src/online/state/index.ts#L47)

#### Parameters

##### state

[`PartialDeep`](PartialDeep.md)\<`TStateShape`\>

#### Returns

[`PartialDeep`](PartialDeep.md)\<`TStateShape`\>

***

### onDeltaReceived()?

> `optional` **onDeltaReceived**: (`delta`) => [`StateDelta`](StateDelta.md)\<`TStateShape`\>

Defined in: [state/index.ts:53](https://github.com/benallfree/lab13/blob/9ac0af7da9640b4b5437ad34793eec1f82ae6b92/sdk/src/online/state/index.ts#L53)

#### Parameters

##### delta

[`StateDelta`](StateDelta.md)\<`TStateShape`\>

#### Returns

[`StateDelta`](StateDelta.md)\<`TStateShape`\>

***

### onStateReceived()?

> `optional` **onStateReceived**: (`currentState`, `newState`) => [`PartialDeep`](PartialDeep.md)\<`TStateShape`\>

Defined in: [state/index.ts:48](https://github.com/benallfree/lab13/blob/9ac0af7da9640b4b5437ad34793eec1f82ae6b92/sdk/src/online/state/index.ts#L48)

#### Parameters

##### currentState

[`PartialDeep`](PartialDeep.md)\<`TStateShape`\>

##### newState

[`PartialDeep`](PartialDeep.md)\<`TStateShape`\>

#### Returns

[`PartialDeep`](PartialDeep.md)\<`TStateShape`\>

***

### socket?

> `optional` **socket**: `PartySocket`

Defined in: [state/index.ts:54](https://github.com/benallfree/lab13/blob/9ac0af7da9640b4b5437ad34793eec1f82ae6b92/sdk/src/online/state/index.ts#L54)
