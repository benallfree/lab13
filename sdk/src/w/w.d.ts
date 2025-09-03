declare global {
  /** Enable shader/program compilation logs (optional) */
  var debug: number
  /** Main WebGL framework object */
  var W: WebGLFramework
  var c: HTMLCanvasElement
}

interface WebGLFramework {
  /** Canvas element used for rendering */
  canvas: HTMLCanvasElement
  /** Object counter for auto-generating names */
  objs: number
  /** Current object states (for animation interpolation) */
  current: Record<string, ObjectState>
  /** Next object states (target states for animation) */
  next: Record<string, ObjectState>
  /** Cached WebGL textures by ID */
  textures: Record<string, WebGLTexture>
  /** WebGL2 rendering context */
  gl: WebGL2RenderingContext
  /** Compiled WebGL shader program */
  program: WebGLProgram
  /** Projection matrix for 3D perspective */
  projection: DOMMatrix
  /** Timestamp of last frame for delta time calculation */
  lastFrame: number
  /** Ambient light intensity (0-1) */
  ambientLight: number

  /** Available 3D models for rendering */
  models: Record<string, Model>
  /** Custom renderers (optional) */
  renderers?: Record<string, any>

  /** Initialize the WebGL framework with a canvas element */
  reset(canvas: HTMLCanvasElement): void

  /** Set object state and create/update 3D objects */
  setState(
    state: Partial<ObjectState>,
    type: string,
    texture?: WebGLTexture,
    i?: any,
    normal?: number[],
    A?: any,
    B?: any,
    C?: any,
    Ai?: any,
    Bi?: any,
    Ci?: any,
    AB?: any,
    BC?: any
  ): void

  /** Main render loop - called automatically by requestAnimationFrame */
  draw(now?: number, dt?: number, v?: DOMMatrix, i?: any, transparent?: ObjectState[]): void

  /** Render a single object to the screen */
  render(object: ObjectState, dt: number, just_compute?: boolean, buffer?: number): void

  /** Interpolate a property between current and next values for smooth animation */
  lerp(item: string, property: string): number

  /** Create transformation matrix from object's current state */
  animation(item: string, m?: DOMMatrix): DOMMatrix

  /** Calculate squared distance between two objects (for transparency sorting) */
  dist(a: ObjectState, b?: ObjectState): number

  /** Set ambient light intensity (0-1) */
  ambient(a: number): void

  /** Convert hex color string to RGBA array */
  col(c: string): number[]

  /** Register a new 3D model type */
  add(name: string, objects: Model): void

  /** Compute smooth normals for a model (optional plugin) */
  smooth(
    state: ObjectState,
    dict?: Record<string, number[]>,
    vertices?: number[][],
    iterate?: any,
    iterateSwitch?: number,
    i?: number,
    j?: number,
    A?: number[],
    B?: number[],
    C?: number[],
    Ai?: number,
    Bi?: number,
    Ci?: number,
    normal?: number[]
  ): void

  /** Create a group object for organizing other objects */
  group(t: Partial<ObjectState>): void

  /** Animate object to new state with optional delay */
  move(t: Partial<ObjectState>, delay?: number): void

  /** Remove object from scene with optional delay */
  delete(t: string, delay?: number): void

  /** Set camera properties with optional delay */
  camera(t: Partial<ObjectState>, delay?: number): void

  /** Set light properties with optional delay */
  light(t: Partial<ObjectState>, delay?: number): void

  /** Create a plane object (2D quad) */
  plane(settings: Partial<ObjectState>): void

  /** Create a cube object */
  cube(settings: Partial<ObjectState>): void

  /** Create a pyramid object */
  pyramid(settings: Partial<ObjectState>): void

  /** Create a sphere object */
  sphere(settings: Partial<ObjectState>): void

  /** Create a billboard object (always faces camera) */
  billboard(settings: Partial<ObjectState>): void

  /** Set background clear color using hex string */
  clearColor(c: string): void
}

interface ObjectState {
  /** Object name (auto-generated if not provided) */
  n?: string

  /** Position coordinates */
  x?: number
  y?: number
  z?: number

  /** Rotation angles in degrees */
  rx?: number
  ry?: number
  rz?: number

  /** Scale dimensions */
  w?: number
  h?: number
  d?: number

  /** Uniform scale (sets w, h, d to same value) */
  size?: number

  /** Color as hex string (e.g., 'f00' for red, '00f' for blue) */
  b?: string

  /** Texture data */
  t?: TextureData

  /** Texture/color mix ratio (0 = full texture, 1 = full color) */
  mix?: number

  /** WebGL draw mode (TRIANGLES, TRIANGLE_STRIP, etc.) */
  mode?: number

  /** Enable smooth shading */
  s?: boolean

  /** Disable shading/lighting */
  ns?: boolean

  /** Animation duration in milliseconds */
  a?: number

  /** Animation timer (internal use) */
  f?: number

  /** Group name for hierarchical transformations */
  g?: string

  /** Camera field of view in degrees */
  fov?: number

  /** Object type (set by framework) */
  type?: string

  /** Current transformation matrix (set by framework) */
  m?: DOMMatrix

  /** Final transformation matrix (set by framework) */
  M?: DOMMatrix
}

interface TextureData {
  /** Unique texture identifier */
  id: string

  /** Texture width in pixels */
  width: number

  /** Texture height in pixels */
  height: number
}

interface Model {
  /** Vertex positions as [x,y,z, x,y,z, ...] array */
  vertices: number[]

  /** Texture coordinates as [u,v, u,v, ...] array */
  uv?: number[]

  /** Triangle indices for indexed rendering */
  indices?: number[]

  /** Vertex normals as [nx,ny,nz, nx,ny,nz, ...] array */
  normals?: number[]

  /** Flag indicating custom normals are provided */
  customNormals?: boolean

  /** WebGL vertex buffer (created by framework) */
  verticesBuffer?: WebGLBuffer

  /** WebGL UV buffer (created by framework) */
  uvBuffer?: WebGLBuffer

  /** WebGL index buffer (created by framework) */
  indicesBuffer?: WebGLBuffer

  /** WebGL normal buffer (created by framework) */
  normalsBuffer?: WebGLBuffer
}

/** Built-in plane model (2D quad) */
interface PlaneModel extends Model {}

/** Built-in cube model (6 faces) */
interface CubeModel extends Model {}

/** Built-in pyramid model (4 triangular faces + base) */
interface PyramidModel extends Model {}

/** Built-in sphere model (generated procedurally) */
interface SphereModel extends Model {}

/** Built-in billboard model (always faces camera) */
interface BillboardModel extends Model {}

export {}
