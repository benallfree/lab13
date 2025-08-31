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

#### Default Compression (Deflate)

By default, l13 uses Deflate compression which provides good balance of speed and size:

```bash
npx l13 build
```

Creates: `<package-name>-<version>.zip` using Deflate compression

#### Experimental Compression Methods

Enable additional compression algorithms for potentially smaller sizes:

```bash
npx l13 build --experimental
```

Tests all compression methods:

- **Deflate** - Standard ZIP compression (default)
- **LZMA** - High compression ratio, slower
- **PPMD** - Prediction by partial matching
- **BZIP2** - Burrows-Wheeler transform compression

The best (smallest) result becomes the main zip file.

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
