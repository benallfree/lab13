export type PointerLockOptions = {
  onMove: (e: MouseEvent) => void
  element: HTMLElement
}
export const usePointerLock = (options?: Partial<PointerLockOptions>) => {
  const { onMove = () => {}, element = document.body } = options ?? {}
  // Mouse controls
  element.addEventListener('click', () => {
    element.requestPointerLock()
  })

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement) {
      onMove(e)
    }
  })
}
