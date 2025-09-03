export const useKeyboard = () => {
  // Keyboard controls
  const keys: { [key: string]: boolean } = {}
  document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true
  })
  document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false
  })
  return { getKeys: () => keys, isKeyPressed: (key: string) => keys[key.toLowerCase()] }
}
