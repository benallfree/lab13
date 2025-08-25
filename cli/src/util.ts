export const toBoolean = (value: string | undefined) => {
  if (!value) return false
  const v = value.toLowerCase()
  return v === 'true' || v === '1' || v === 'yes'
}
