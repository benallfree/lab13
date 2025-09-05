import { BotState, PlayerState } from '.'
const lionModels = new Map<string, string[]>()

export const removeLionModel = (id: string) => {
  if (!lionModels.has(id)) return
  lionModels.get(id)?.forEach((id) => {
    W.delete(id)
  })
  lionModels.delete(id)
}

export const gcLionModels = (playerIds: string[]) => {
  lionModels.forEach((ids, id) => {
    if (!playerIds.includes(id)) removeLionModel(id)
  })
}

const LION_MODES = {
  c: {},
}

const pick = <T extends Record<string, any>>(
  obj: T,
  keys = ['x', 'y', 'z', 'rx', 'ry', 'rz', 'w', 'h', 'd', 'b']
): Partial<T> => {
  return keys.reduce((acc, key) => {
    if (key in obj) acc[key as keyof T] = obj[key as keyof T]
    return acc
  }, {} as Partial<T>)
}

const createModelTree = (node: Record<string, any>, rootKey: string, key?: string, parent?: string) => {
  // console.log('createModelTree', { rootKey, key, parent })
  const g = parent ?? undefined
  const n = [rootKey, key].filter(Boolean).join('-')
  const ids: string[] = [n]
  const finalProps = { g, n, ...pick(node) }
  const type = node.cube ? 'cube' : 'group'
  // console.log('finalProps', type, JSON.stringify(finalProps, null, 2))
  W.setState(finalProps, type)

  for (const childKey in node) {
    const child = node[childKey]!
    if (typeof child !== 'object') continue
    ids.push(...createModelTree(child, rootKey, childKey, n))
  }
  return ids
}

export const ensureLionModel = (id: string, props: PlayerState | BotState) => {
  if (lionModels.has(id)) return
  // console.log(`lion`, id, props)

  const cube = true
  const b = props.w.b
  const model = {
    w: 1,
    h: 1,
    d: 1,
    y: 0.5,
    ...pick(props.w),
    container: {
      ry: -90,
      body: {
        cube,
        y: 0.6,
        w: 1.2,
        h: 0.8,
        d: 0.8,
        b,
      },
      head: {
        skull: {
          cube,
          y: 0.8,
          x: -0.8,
          w: 0.8,
          h: 0.6,
          d: 0.8,
          b,
        },
        snout: {
          cube,
          y: 0.7,
          x: -1.3,
          w: 0.4,
          h: 0.4,
          d: 0.6,
          b,
        },
        nose: {
          cube,
          y: 0.7,
          x: -1.5,
          w: 0.1,
          h: 0.1,
          d: 0.1,
          b: b == '000' ? 'fff' : '000',
        },
        eyeL: {
          eyeballL: {
            cube,
            y: 1,
            x: -1.2,
            z: 0.2,
            w: 0.1,
            h: 0.1,
            d: 0.1,
            b: 'fff',
          },
          irisL: {
            cube,
            y: 1,
            x: -1.25,
            z: -0.2,
            w: 0.05,
            h: 0.05,
            d: 0.02,
            b,
          },
        },
        eyeR: {
          eyeballR: {
            cube,
            y: 1,
            x: -1.2,
            z: -0.2,
            w: 0.1,
            h: 0.1,
            d: 0.1,
            b: 'fff',
          },
          irisR: {
            cube,
            y: 1,
            x: -1.25,
            z: 0.2,
            w: 0.05,
            h: 0.05,
            d: 0.02,
            b,
          },
        },
        earL: {
          cube,
          y: 1.1,
          x: -0.7,
          z: 0.3,
          w: 0.2,
          h: 0.2,
          d: 0.2,
          b,
        },
        earR: {
          cube,
          y: 1.1,
          x: -0.7,
          z: -0.3,
          w: 0.2,
          h: 0.2,
          d: 0.2,
          b,
        },
      },
      tail: {
        cube,
        y: 0.8,
        x: 0.9,
        w: 0.8,
        h: 0.1,
        d: 0.1,
        b,
      },
      legFL: {
        cube,
        y: 0.3,
        x: -0.3,
        z: 0.4,
        w: 0.2,
        h: 0.6,
        d: 0.2,
        b,
      },
      legFR: {
        cube,
        y: 0.3,
        x: -0.3,
        z: -0.4,
        w: 0.2,
        h: 0.6,
        d: 0.2,
        b,
      },
      legBL: {
        cube,
        y: 0.3,
        x: 0.3,
        z: 0.4,
        w: 0.2,
        h: 0.6,
        d: 0.2,
        b,
      },
      legBR: {
        cube,
        y: 0.3,
        x: 0.3,
        z: -0.4,
        w: 0.2,
        h: 0.6,
        d: 0.2,
        b,
      },
    },
  }

  // console.log('model', JSON.stringify(model, null, 2))
  const ids = createModelTree(model, id)
  // console.log('ids', ids)

  lionModels.set(id, ids)
  W.move({ n: id, ...props.w })
}

export const walk = (playerId: string, t: number) => {
  const legOffset = Math.sin(t) * 0.2
  const bounceOffset = Math.abs(Math.sin(t * 2)) * 0.1 // Gallop bounce

  // Animate legs
  W.move({ n: `${playerId}-legFL`, y: 0.3 + legOffset })
  W.move({ n: `${playerId}-legBR`, y: 0.3 + legOffset })
  W.move({ n: `${playerId}-legFR`, y: 0.3 - legOffset })
  W.move({ n: `${playerId}-legBL`, y: 0.3 - legOffset })

  // Animate whole lion body bouncing
  W.move({ n: `${playerId}-container`, y: bounceOffset })
}

export const transformLionModel = (playerId: string, player: PlayerState | BotState) => {
  const lionColor = player.w.b
  const mode = player.m
  switch (mode) {
    case 'c':
      break
    case 'b':
      break
  }
}
