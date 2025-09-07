---
sidebar_position: 5
---

# GLSL Shader Support

The Lab13 CLI includes built-in support for GLSL (OpenGL Shading Language) shaders with automatic minification and TypeScript integration. This makes it easy to create 3D graphics and visual effects in your JS13K games.

## Quick Start

1. **Create shader files** in your project
2. **Import them** in your TypeScript/JavaScript code
3. **Use with WebGL** - the CLI handles the rest!

## Supported File Extensions

The CLI automatically processes these GLSL file types:

- `.glsl` - Generic GLSL shader files
- `.vert` - Vertex shaders
- `.frag` - Fragment shaders
- `.vs` - Vertex shaders (alternative)
- `.fs` - Fragment shaders (alternative)

## Basic Usage

### Create Shader Files

Create a `shaders` folder in your `src` directory:

```
src/
├── main.ts
└── shaders/
    ├── vertex.glsl
    └── fragment.glsl
```

**vertex.glsl:**

```glsl
attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

**fragment.glsl:**

```glsl
precision mediump float;

uniform float time;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float wave = sin(uv.x * 10.0 + time) * 0.5 + 0.5;
  gl_FragColor = vec4(wave, 0.5, 1.0, 1.0);
}
```

## TypeScript Support

To get proper TypeScript support for GLSL imports, add the vite-plugin-glsl type declarations to your `tsconfig.json`:

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "types": ["vite-plugin-glsl/ext"]
  }
}
```

Or add it as a reference directive to your global types:

```typescript
/// <reference types="vite-plugin-glsl/ext" />
```

This gives you:

- ✅ **Type safety** - TypeScript knows GLSL files export strings
- ✅ **IntelliSense** - Auto-completion in your IDE
- ✅ **Error checking** - Catch import errors at compile time

## Complete Example

Here's a complete example using GLSL shaders with the W library:

**src/main.ts:**

```typescript
import { useResizer } from 'lab13-sdk'
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'

// Initialize W
W.reset(c)
W.light({ y: -1 })
W.ambient(0.2)

// Setup canvas resizing
useResizer()

// Create a custom shader material
const material = W.material({
  vertexShader,
  fragmentShader,
  uniforms: {
    time: { value: 0 },
  },
})

// Create a cube with the custom shader
W.cube({
  n: 'animated-cube',
  w: 2,
  h: 2,
  d: 2,
  m: material,
})

// Animate the shader
let time = 0
useSpeedThrottledRaf(60, () => {
  time += 0.01
  material.uniforms.time.value = time
})
```
