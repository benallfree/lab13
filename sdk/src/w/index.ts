export const useResizer = () => {
  // Get canvas and set up resize handling
  const c = document.getElementById('c') as HTMLCanvasElement

  // Function to resize canvas to fill window
  const resizeCanvas = () => {
    c.width = window.innerWidth
    c.height = window.innerHeight
    // Update WebGL viewport if W.gl exists
    if (W.gl) {
      W.gl.viewport(0, 0, c.width, c.height)
      // Recalculate projection matrix with new aspect ratio
      if (W.projection) {
        const fov = 30 // Default FOV from W library
        W.projection = new DOMMatrix([
          1 / Math.tan((fov * Math.PI) / 180) / (c.width / c.height),
          0,
          0,
          0,
          0,
          1 / Math.tan((fov * Math.PI) / 180),
          0,
          0,
          0,
          0,
          -1001 / 999,
          -1,
          0,
          0,
          -2002 / 999,
          0,
        ])
      }
    }
  }

  // Initial resize
  resizeCanvas()

  // Handle window resize
  window.addEventListener('resize', resizeCanvas)
}

export const useSpeedThrottledRaf = (moveSpeed: number, moveFunction: (speed: number) => void) => {
  let lastTime = 0
  const animate = (currentTime: number) => {
    const deltaTime = (currentTime - lastTime) / 1000
    lastTime = currentTime
    moveFunction(moveSpeed * deltaTime)
    requestAnimationFrame(animate)
  }
  requestAnimationFrame(animate)
}

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
