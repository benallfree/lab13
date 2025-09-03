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
