// Simple Vector type for js13k
export type Vector = { x: number; y: number; z: number }
export const vec = (x = 0, y = 0, z = 0): Vector => ({ x, y, z })
