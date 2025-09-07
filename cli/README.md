## Lab13 CLI

Command‑line tools for building and serving js13kGames projects with advanced compression and optimization features.

### Quick start

```bash
npx l13 --help
```

Run a specific command:

```bash
npx l13 <command>
```

### Configuration

#### Vite Configuration Support

l13 automatically detects and uses your existing `vite.config.ts` (or `vite.config.js`) file. The CLI extends your Vite configuration with js13k-specific optimizations while preserving your custom settings.

**How it works:**

- **Automatic detection** - l13 looks for `vite.config.ts`, `vite.config.js`, or `vite.config.mjs` in your project root
- **Configuration merging** - Your custom Vite config is merged with l13's optimizations
- **Plugin compatibility** - Most Vite plugins work seamlessly with l13
- **Fallback defaults** - If no config file exists, l13 uses sensible defaults

**Example vite.config.ts:**

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  // Your custom configuration
  plugins: [
    /* your plugins */
  ],
  build: {
    target: 'es2020',
    rollupOptions: {
      input: 'src/main.ts',
    },
  },
})
```

**Note:** l13 will automatically add js13k-specific optimizations like aggressive minification and asset inlining to your existing configuration.

### Commands

#### `dev` - Development Server

Run the Vite dev server with l13 defaults and automatic rebuilding.

```bash
npx l13 dev
```

**Options:**

- `--base <path>` - Public base path when served in production
- `--out <dir>` - Output directory (default: `dist`)
- `--debug` - Enable debug mode (can also use `DEBUG=true` env var)
- `--html-minify` - Enable HTML minification (default: true)
- `--no-html-minify` - Disable HTML minification
- `--inline-css` - Inline CSS assets into HTML (default: true)
- `--no-inline-css` - Disable inlining CSS assets into HTML
- `--inline-js` - Inline JS assets into HTML (default: true)
- `--no-inline-js` - Disable inlining JS assets into HTML
- `--terser` - Enable Terser minification (default: true)
- `--no-terser` - Disable Terser minification
- `--roadroller` - Enable roadroller compression (can also use `ROADROLLER=true` env var)
- `--experimental` - Enable experimental compression methods (can also use `EXPERIMENTAL=true` env var)
- `--exclude <pattern>` - Exclude files matching pattern (can be used multiple times)
- `--dev-bundle` - Build the zip bundle using Vite's dev mode

**Features:**

- Hot reload with automatic rebuilds
- File watching with debounced zip creation
- Automatic compression testing when files change
- Size analysis and progress tracking

#### `build` - Production Build

Build the project with l13 Vite defaults and advanced compression.

```bash
npx l13 build
```

**Options:**

- `--watch` - Watch for file changes and rebuild
- `--base <path>` - Public base path when served in production
- `--out <dir>` - Output directory (default: `dist`)
- `--debug` - Enable debug mode (can also use `DEBUG=true` env var)
- `--html-minify` - Enable HTML minification (default: true)
- `--no-html-minify` - Disable HTML minification
- `--inline-css` - Inline CSS assets into HTML (default: true)
- `--no-inline-css` - Disable inlining CSS assets into HTML
- `--inline-js` - Inline JS assets into HTML (default: true)
- `--no-inline-js` - Disable inlining JS assets into HTML
- `--terser` - Enable Terser minification (default: true)
- `--no-terser` - Disable Terser minification
- `--roadroller` - Enable roadroller compression (can also use `ROADROLLER=true` env var)
- `--experimental` - Enable experimental compression methods (can also use `EXPERIMENTAL=true` env var)
- `--exclude <pattern>` - Exclude files matching pattern (can be used multiple times)
- `--dev` - Build the zip bundle using Vite's dev mode

**Note:** By default, the bundle is built with production settings (`import.meta.env.DEV: false`, `import.meta.env.PROD: true`). Use `--dev` to disable these overrides and let Vite determine the environment variables.

**Build Process:**

1. **Minification** - Terser with aggressive optimizations
2. **HTML Minification** - HTML minifier with aggressive optimizations
3. **Asset Inlining** - CSS and JavaScript inlining with CleanCSS optimization
4. **Roadroller** (optional) - Advanced JavaScript packing
5. **Compression** - Multiple ZIP compression methods with automatic selection
6. **Size Analysis** - Visual progress bar and size reporting

**Note:** Terser property mangling only works with `$` or `_` prefixed "private" variables. Use these prefixes for properties you want to be mangled for maximum compression.

#### `preview` - Local Preview

Serve the built `dist/` directory with Express.

```bash
npx l13 preview
```

**Environment Variables:**

- `PORT` - Set the port (default: `4173`)

#### `create` - Project Scaffolding

Scaffold a new project from the official examples.

```bash
npx l13 create
```

Follow the prompts to pick an example and target directory.

### Compression Features

#### Default Compression (Dual Deflate)

By default, l13 uses a dual-compression approach with both **7zip deflate** and **ECT deflate** to ensure optimal file sizes:

```bash
npx l13 build
```

**How it works:**

- **7zip deflate** - Standard ZIP compression with 7zip's optimized deflate implementation
- **ECT deflate** - Enhanced Compression Tool's deflate implementation, known to perform better in some cases
- **Automatic selection** - l13 tests both methods and automatically chooses the smaller result
- **Fallback** - If ECT is unavailable, falls back to 7zip deflate only

Creates: `<package-name>-<version>.zip` using the best deflate compression result

**Note:** ECT is known to achieve better compression ratios in many cases, but results can vary depending on the content. The dual approach ensures you always get the optimal size.

#### Experimental Compression Methods

Enable additional compression algorithms for potentially smaller sizes:

```bash
npx l13 build --experimental
```

Tests all compression methods:

- **Dual Deflate** - 7zip deflate + ECT deflate (best result selected)
- **LZMA** - High compression ratio, slower
- **PPMD** - Prediction by partial matching
- **BZIP2** - Burrows-Wheeler transform compression

The best (smallest) result becomes the main zip file.

**Note:** When `--experimental` is enabled, l13 still uses the dual deflate approach (7zip + ECT) as the baseline, then compares against the additional algorithms.

#### Asset Inlining

Control how CSS and JavaScript assets are handled during the build process:

**CSS Inlining:**

- **Enabled by default** - CSS is inlined into the HTML with CleanCSS level 2 optimization
- **Disable with `--no-inline-css`** - CSS remains as external files

**JavaScript Inlining:**

- **Enabled by default** - JavaScript is inlined into the HTML
- **Disable with `--no-inline-js`** - JavaScript remains as external files
- **Automatically disabled with `--roadroller`** - Roadroller needs external JS files to pack

**Examples:**

```bash
# Default behavior - both CSS and JS inlined
npx l13 build

# Keep CSS external, inline JS
npx l13 build --no-inline-css

# Keep JS external, inline CSS
npx l13 build --no-inline-js

# Keep both external
npx l13 build --no-inline-css --no-inline-js

# Roadroller automatically disables inline-js
npx l13 build --roadroller
```

#### Roadroller Compression

For maximum compression, enable roadroller which:

- Packs JavaScript using advanced algorithms
- Requires external JavaScript files (automatically disables inline-js)
- Optimizes for the 13KB limit

```bash
npx l13 build --roadroller
```

**When to use:**

- When your zip exceeds 13KB
- For maximum size optimization
- During final production builds

**Note:** Roadroller automatically disables `--inline-js` since it needs external JavaScript files to pack them.

#### GLSL Shader Support

l13 includes built-in support for GLSL (OpenGL Shading Language) shaders with automatic minification and optimization:

**Features:**

- **Automatic GLSL Processing** - `.glsl`, `.vert`, `.frag`, `.vs`, `.fs` files are automatically processed
- **Shader Minification** - GLSL code is minified to reduce file size (enabled by default)
- **Import Support** - Import shaders directly in your JavaScript/TypeScript code
- **Hot Reload** - Shader changes trigger automatic rebuilds in development mode

**Usage:**

```javascript
// Import shaders directly in your code
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'

// Use with WebGL
const shader = gl.createShader(gl.VERTEX_SHADER)
gl.shaderSource(shader, vertexShader)
gl.compileShader(shader)
```

**Supported File Extensions:**

- `.glsl` - Generic GLSL shader files
- `.vert` - Vertex shaders
- `.frag` - Fragment shaders
- `.vs` - Vertex shaders (alternative)
- `.fs` - Fragment shaders (alternative)

**Example Project Structure:**

```
src/
├── main.ts
└── shaders/
    ├── vertex.glsl
    └── fragment.glsl
```

**Note:** GLSL shaders are automatically minified during the build process to optimize for the 13KB size limit. The minification removes comments, unnecessary whitespace, and optimizes the shader code for maximum compression.

### File Exclusion

Exclude files from the build using glob patterns:

```bash
# Exclude specific files
npx l13 build --exclude "*.map" --exclude "meta.json"

# Exclude multiple patterns
npx l13 build --exclude "*.map" --exclude "*.log" --exclude "temp/*"
```

### Size Analysis

The build process provides detailed size analysis:

```
=== Compression Results ===
   DEFLATE: 12450 bytes
🏆 LZMA: 11890 bytes
   PPMD: 12120 bytes
   BZIP2: 12560 bytes

🏆 LZMA: 11890 bytes | [████████░░] 89.3% of 13312 bytes | +1422 bytes remaining
```
