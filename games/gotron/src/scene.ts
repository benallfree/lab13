import { BoxApi } from './box'
import { CubeApi } from './cube'
import { Group } from './group'
import { PlaneApi } from './plane'
import { Triangle } from './triangle'

// WebGL utilities
function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }

  return shader
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram()
  if (!program) return null

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }

  return program
}

// Matrix utilities
export function multiplyMatrices(a: Float32Array, b: Float32Array): Float32Array {
  const result = new Float32Array(16)

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result[i * 4 + j] =
        a[i * 4 + 0] * b[0 * 4 + j] +
        a[i * 4 + 1] * b[1 * 4 + j] +
        a[i * 4 + 2] * b[2 * 4 + j] +
        a[i * 4 + 3] * b[3 * 4 + j]
    }
  }

  return result
}

export function createIdentityMatrix(): Float32Array {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
}

export function createTranslationMatrix(x: number, y: number, z: number): Float32Array {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1])
}

export function createRotationYMatrix(angle: number): Float32Array {
  const c = Math.cos(angle)
  const s = Math.sin(angle)

  return new Float32Array([c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1])
}

export function createRotationXMatrix(angle: number): Float32Array {
  const c = Math.cos(angle)
  const s = Math.sin(angle)

  return new Float32Array([1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1])
}

export function createRotationZMatrix(angle: number): Float32Array {
  const c = Math.cos(angle)
  const s = Math.sin(angle)

  return new Float32Array([c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
}

export function createPerspectiveMatrix(fov: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1.0 / Math.tan((fov * 0.5 * Math.PI) / 180)

  return new Float32Array([
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) / (near - far),
    -1,
    0,
    0,
    (2 * far * near) / (near - far),
    0,
  ])
}

// Shader sources
const vertexShaderSource = `
  attribute vec3 a_position;
  attribute vec3 a_color;
  
  uniform mat4 u_modelViewMatrix;
  uniform mat4 u_projectionMatrix;
  
  varying vec3 v_color;
  
  void main() {
    gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 1.0);
    v_color = a_color;
  }
`

const fragmentShaderSource = `
  precision mediump float;
  
  varying vec3 v_color;
  
  void main() {
    gl_FragColor = vec4(v_color, 1.0);
  }
`

declare global {
  interface Window {
    scene: SceneApi
  }
  var scene: SceneApi
}

// Scene factory function
export type SceneOptions = {
  global: boolean
  width: number
  height: number
}
export type SceneApi = {
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  add: (object: Triangle | Group | PlaneApi | BoxApi | CubeApi) => void
  render: (time: number) => void
  renderHUD: () => void
  wireframe: (enabled?: boolean) => boolean
  quality: (newQuality?: number) => number
  lod: (distance?: number) => number
}
export function Scene(options?: Partial<SceneOptions>): SceneApi {
  const { global = true, width = 800, height = 600 } = options ?? {}
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const gl = canvas.getContext('webgl')!
  const projectionMatrix = createPerspectiveMatrix(45, canvas.width / canvas.height, 0.1, 100.0)
  const objects: Array<Triangle | Group | PlaneApi | BoxApi | CubeApi> = []
  let wireframeMode = false
  let globalQuality = 1.0
  let lodDistance = 0

  function createShaderProgram(): WebGLProgram {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)!
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)!
    const program = createProgram(gl, vertexShader, fragmentShader)!

    gl.useProgram(program)
    const projectionMatrixLocation = gl.getUniformLocation(program, 'u_projectionMatrix')
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix)

    return program
  }

  function setupGL() {
    gl.enable(gl.DEPTH_TEST)
    gl.clearColor(0.2, 0.3, 0.4, 1.0)
  }

  const program = createShaderProgram()
  setupGL()

  const api: SceneApi = {
    canvas,
    gl,
    add: function (object: Triangle | Group | PlaneApi | BoxApi | CubeApi) {
      objects.push(object)
    },
    render: function (time: number) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      for (const object of objects) {
        // Each object handles its own transformation
        object.render(gl, program, createIdentityMatrix(), wireframeMode)
      }
    },
    renderHUD: function () {
      // Create or update HUD
      let hud = document.getElementById('webgl-hud')
      if (!hud) {
        hud = document.createElement('div')
        hud.id = 'webgl-hud'
        hud.style.cssText = `
          position: fixed;
          top: 10px;
          left: 10px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          font-family: monospace;
          font-size: 12px;
          padding: 10px;
          border-radius: 5px;
          z-index: 1000;
          min-width: 200px;
        `
        document.body.appendChild(hud)
      }

      const objectCount = objects.length

      hud.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold; border-bottom: 1px solid #666; padding-bottom: 5px;">
          WebGL Scene Controls
        </div>
        <div style="margin-bottom: 5px;">
          <strong>Wireframe:</strong> ${wireframeMode ? 'ON' : 'OFF'} <span style="color: #aaa;">(press .)</span>
        </div>
        <div style="margin-bottom: 5px;">
          <strong>Global Quality:</strong> ${(globalQuality * 100).toFixed(0)}% <span style="color: #aaa;">(press q)</span>
        </div>
        <div style="margin-bottom: 5px;">
          <strong>LOD Distance:</strong> ${lodDistance} <span style="color: #aaa;">(press l)</span>
        </div>
        <div style="margin-bottom: 5px;">
          <strong>Objects:</strong> ${objectCount} total
        </div>
        <div style="margin-bottom: 10px; border-top: 1px solid #666; padding-top: 5px;">
          <strong>Controls:</strong>
        </div>
        <div style="font-size: 11px; color: #ccc;">
          <div>• <strong>.</strong> - Toggle wireframe</div>
          <div>• <strong>q</strong> - Toggle quality (high/low)</div>
          <div>• <strong>l</strong> - Toggle LOD (on/off)</div>
        </div>
      `
    },
    wireframe: function (enabled?: boolean) {
      if (enabled !== undefined) {
        wireframeMode = enabled
      } else {
        wireframeMode = !wireframeMode
      }
      return wireframeMode
    },
    quality: function (newQuality?: number) {
      if (newQuality !== undefined) {
        globalQuality = Math.max(0.0, Math.min(1.0, newQuality))
        // Update quality for all objects (all objects now have quality method)
        for (const object of objects) {
          object.state.quality = globalQuality
        }
      }
      return globalQuality
    },
    lod: function (distance?: number) {
      if (distance !== undefined) {
        lodDistance = distance
        // Calculate quality based on distance for all objects
        for (const object of objects) {
          // Simple distance-based LOD: closer = higher quality
          const quality = Math.max(0.1, 1.0 - distance / 50)
          object.state.quality = quality
        }
      }
      return lodDistance
    },
  }

  if (global) {
    window.scene = api
  }

  return api
}
