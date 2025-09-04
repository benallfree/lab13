import { PartialDeep } from 'lab13-sdk'
import { PlayerState } from '.'
const lionModels = new Map<string, string[]>()

export const removeLion = (id: string) => {
  if (!lionModels.has(id)) return
  lionModels.get(id)?.forEach((id) => {
    W.delete(id)
  })
  lionModels.delete(id)
}

export const gcLions = (playerIds: string[]) => {
  lionModels.forEach((ids, id) => {
    if (!playerIds.includes(id)) removeLion(id)
  })
}

export const ensureLionModel = (id: string, props: PartialDeep<PlayerState>) => {
  if (lionModels.has(id)) return
  console.log(`lion`, id, props)
  const ids: string[] = []

  ids.push(id)
  W.group({
    n: id,
    w: 1,
    h: 1,
    d: 1,
    y: 0.5,
    ...props,
  })

  ids.push(`${id}-container`)
  W.group({
    g: id,
    n: `${id}-container`,
    ry: -90,
  })

  // Body
  ids.push(`${id}-body`)
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
  ids.push(`${id}-head`)
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
  ids.push(`${id}-snout`)
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
  ids.push(`${id}-nose`)
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
  ids.push(`${id}-eye-l`)
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
  ids.push(`${id}-eye-r`)
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
  ids.push(`${id}-iris-l`)
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
  ids.push(`${id}-iris-r`)
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
  ids.push(`${id}-ear-l`)
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
  ids.push(`${id}-ear-r`)
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
  ids.push(`${id}-tail`)
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
  ids.push(`${id}-leg-fl`)
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
  ids.push(`${id}-leg-fr`)
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
  ids.push(`${id}-leg-bl`)
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
  ids.push(`${id}-leg-br`)
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

  lionModels.set(id, ids)
  W.move({ n: id, ...props })
}
