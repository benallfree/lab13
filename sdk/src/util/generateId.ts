// Compact GUID generator - 16 chars, very unique
export const generateId = () => {
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 8)
  return (t + r).slice(-16)
}
