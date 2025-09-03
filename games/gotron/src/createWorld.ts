export const createWorld = () => {
  W.reset(c)
  W.light({ x: 0, y: -1, z: 0 })
  W.ambient(0.2)
  W.clearColor('#ADD8E6')

  // Create a plane
  W.cube({ n: 'plane', y: -0.5, w: 100, h: 1, d: 100, rx: 0, b: '2a5' })
}
