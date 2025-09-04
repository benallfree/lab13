import { PartialDeep } from 'lab13-sdk'
import { PlayerState } from '.'
const lions = new Set<string>()

export const removeLion = (id: string) => {
  if (!lions.has(id)) return
  W.delete(id)
  lions.delete(id)
}

export const gcLions = (playerIds: string[]) => {
  for (const id of lions) if (!playerIds.includes(id)) removeLion(id)
}

export const ensureLionModel = (id: string, props: PartialDeep<PlayerState>) => {
  if (lions.has(id)) return
  console.log(`lion`, id, props)
  lions.add(id)
  W.group({
    n: id,
    w: 1,
    h: 1,
    d: 1,
    y: 0.5,
    ...props,
  })
  W.group({
    g: id,
    n: `${id}-container`,
    ry: -90,
  })
  // Body
  W.cube({
    g: `${id}-container`,
    n: `${id}-body`,
    y: 0.6,
    w: 1.2,
    h: 0.8,
    d: 0.8,
    b: props.b,
  })
  // Head
  W.cube({
    g: `${id}-container`,
    n: `${id}-head`,
    y: 0.8,
    x: -0.8,
    w: 0.8,
    h: 0.6,
    d: 0.8,
    b: props.b,
  })
  // Snout
  W.cube({
    g: `${id}-container`,
    n: `${id}-snout`,
    y: 0.7,
    x: -1.3,
    w: 0.4,
    h: 0.4,
    d: 0.6,
    b: props.b,
  })
  // Nose
  W.cube({
    g: `${id}-container`,
    n: `${id}-nose`,
    y: 0.7,
    x: -1.5,
    w: 0.1,
    h: 0.1,
    d: 0.1,
    b: props.b == '000' ? 'fff' : '000',
  })
  // Eyes
  W.cube({
    g: `${id}-container`,
    n: `${id}-eye-l`,
    y: 1,
    x: -1.2,
    z: 0.2,
    w: 0.1,
    h: 0.1,
    d: 0.1,
    b: 'fff',
  })
  W.cube({
    g: `${id}-container`,
    n: `${id}-eye-r`,
    y: 1,
    x: -1.2,
    z: -0.2,
    w: 0.1,
    h: 0.1,
    d: 0.1,
    b: 'fff',
  })
  // Irises
  W.cube({
    g: `${id}-container`,
    n: `${id}-iris-l`,
    y: 1,
    x: -1.25,
    z: 0.2,
    w: 0.05,
    h: 0.05,
    d: 0.02,
    b: props.b,
  })
  W.cube({
    g: `${id}-container`,
    n: `${id}-iris-r`,
    y: 1,
    x: -1.25,
    z: -0.2,
    w: 0.05,
    h: 0.05,
    d: 0.02,
    b: props.b,
  })
  // Ears
  W.cube({
    g: `${id}-container`,
    n: `${id}-ear-l`,
    y: 1.1,
    x: -0.7,
    z: 0.3,
    w: 0.2,
    h: 0.2,
    d: 0.2,
    b: props.b,
  })
  W.cube({
    g: `${id}-container`,
    n: `${id}-ear-r`,
    y: 1.1,
    x: -0.7,
    z: -0.3,
    w: 0.2,
    h: 0.2,
    d: 0.2,
    b: props.b,
  })
  // Tail
  W.cube({
    g: `${id}-container`,
    n: `${id}-tail`,
    y: 0.8,
    x: 0.9,
    w: 0.8,
    h: 0.1,
    d: 0.1,
    b: props.b,
  })
  // Legs
  W.cube({
    g: `${id}-container`,
    n: `${id}-leg-fl`,
    y: 0.3,
    x: -0.3,
    z: 0.4,
    w: 0.2,
    h: 0.6,
    d: 0.2,
    b: props.b,
  })
  W.cube({
    g: `${id}-container`,
    n: `${id}-leg-fr`,
    y: 0.3,
    x: -0.3,
    z: -0.4,
    w: 0.2,
    h: 0.6,
    d: 0.2,
    b: props.b,
  })
  W.cube({
    g: `${id}-container`,
    n: `${id}-leg-bl`,
    y: 0.3,
    x: 0.3,
    z: 0.4,
    w: 0.2,
    h: 0.6,
    d: 0.2,
    b: props.b,
  })
  W.cube({
    g: `${id}-container`,
    n: `${id}-leg-br`,
    y: 0.3,
    x: 0.3,
    z: -0.4,
    w: 0.2,
    h: 0.6,
    d: 0.2,
    b: props.b,
  })
  W.move({ n: id, ...props })
}
