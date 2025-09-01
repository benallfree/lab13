// Simple Euler type for js13k
export type Euler = { x: number; y: number; z: number }
export const euler = (x = 0, y = 0, z = 0): Euler => ({ x, y, z })
