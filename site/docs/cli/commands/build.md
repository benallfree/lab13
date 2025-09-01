---
title: Build Command
sidebar_position: 3
---

# `l13 build`

Build the project with JS13K-optimized defaults and create compressed zip files.

## Usage

```bash
npx l13 build [options]
```

## Description

The `build` command creates an optimized production build specifically designed for JS13K games. It applies aggressive minification, compression, and asset optimization to help you stay within the 13KB size limit.

## Options

| Option                | Type     | Default | Description                                                 |
| --------------------- | -------- | ------- | ----------------------------------------------------------- |
| `--watch`             | boolean  | `false` | Watch for file changes and rebuild                          |
| `--base <path>`       | string   | `/`     | Public base path when served in production                  |
| `--out <dir>`         | string   | `dist`  | Output directory                                            |
| `--debug`             | boolean  | `false` | Enable debug mode                                           |
| `--roadroller`        | boolean  | `false` | Enable Roadroller compression                               |
| `--html-minify`       | boolean  | `true`  | Enable HTML minification                                    |
| `--no-html-minify`    | -        | -       | Disable HTML minification                                   |
| `--terser`            | boolean  | `true`  | Enable Terser minification                                  |
| `--no-terser`         | -        | -       | Disable Terser minification                                 |
| `--inline-css`        | boolean  | `true`  | Inline CSS assets into HTML                                 |
| `--no-inline-css`     | -        | -       | Disable inlining CSS assets                                 |
| `--inline-js`         | boolean  | `true`  | Inline JS assets into HTML                                  |
| `--no-inline-js`      | -        | -       | Disable inlining JS assets                                  |
| `--experimental`      | boolean  | `false` | Enable experimental compression methods                     |
| `--ect`               | boolean  | `true`  | Enable ECT compression                                      |
| `--no-ect`            | -        | -       | Disable ECT compression                                     |
| `--exclude <pattern>` | string[] | `[]`    | Exclude files matching pattern (can be used multiple times) |
| `--dev`               | boolean  | `false` | Build the zip bundle using Vite's dev mode                  |

## Examples

```bash
# Build with default optimizations
npx l13 build

# Build with watch mode for continuous development
npx l13 build --watch

# Build with Roadroller compression
npx l13 build --roadroller

# Build with debug logging
npx l13 build --debug

# Disable certain optimizations for testing
npx l13 build --no-html-minify --no-terser

# Exclude test files from the build
npx l13 build --exclude "*.test.js" --exclude "**/*.spec.js"

# Build with experimental compression
npx l13 build --experimental

# Build using Vite dev mode (faster, less optimized)
npx l13 build --dev
```

## Build Process

1. **Vite Build**: Creates optimized bundle using Vite
2. **Asset Inlining**: Inlines CSS and JS into HTML (unless disabled)
3. **Minification**: Applies Terser and HTML minification
4. **Compression**: Creates multiple zip files with different compression methods
5. **Size Reporting**: Shows final file sizes

## Compression Methods

The build process creates multiple zip files with different compression algorithms:

- **Standard ZIP** - Basic compression
- **Deflate** - Enhanced compression
- **ECT** - Extreme Compression Tool (default enabled)
- **Roadroller** - Advanced JavaScript compression (optional)
- **Experimental** - Additional compression methods (optional)

## Output Files

After a successful build, you'll find:

- `dist/` - Optimized build files
- `.lab13/` - Generated zip files with various compression methods
- `game-{version}.zip` - Standard zip file
- `lab13-{name}-{version}.zip` - Compressed zip files

## Environment Variables

- `DEBUG=true` - Enable debug mode
- `ROADROLLER=true` - Enable Roadroller compression
- `EXPERIMENTAL=true` - Enable experimental features

## Notes

- Roadroller and inline-js are incompatible (Roadroller needs external JS files)
- The build process automatically creates a `.lab13` directory
- Zip files are named based on your `package.json` name and version
- Watch mode is useful for continuous development without the dev server
