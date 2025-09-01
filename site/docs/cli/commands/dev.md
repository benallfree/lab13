---
title: Dev Command
sidebar_position: 2
---

# `l13 dev`

Start a development server with hot reload and automatic builds.

## Usage

```bash
npx l13 dev [options]
```

## Description

The `dev` command starts a Vite development server with JS13K-specific optimizations. It automatically rebuilds and creates zip files when source files change, making it perfect for iterative development while staying within the 13KB constraint.

## Options

| Option                | Type     | Default | Description                                                 |
| --------------------- | -------- | ------- | ----------------------------------------------------------- |
| `--base <path>`       | string   | `/`     | Public base path when served in production                  |
| `--out <dir>`         | string   | `dist`  | Output directory                                            |
| `--debug`             | boolean  | `false` | Enable debug mode                                           |
| `--roadroller`        | boolean  | `false` | Enable Roadroller compression                               |
| `--html-minify`       | boolean  | `true`  | Enable HTML minification                                    |
| `--no-html-minify`    | -        | -       | Disable HTML minification                                   |
| `--terser`            | boolean  | `true`  | Enable Terser minification                                  |
| `--no-terser`         | -        | -       | Disable Terser minification                                 |
| `--experimental`      | boolean  | `false` | Enable experimental compression methods                     |
| `--inline-css`        | boolean  | `true`  | Inline CSS assets into HTML                                 |
| `--no-inline-css`     | -        | -       | Disable inlining CSS assets                                 |
| `--inline-js`         | boolean  | `true`  | Inline JS assets into HTML                                  |
| `--no-inline-js`      | -        | -       | Disable inlining JS assets                                  |
| `--ect`               | boolean  | `true`  | Enable ECT compression                                      |
| `--no-ect`            | -        | -       | Disable ECT compression                                     |
| `--exclude <pattern>` | string[] | `[]`    | Exclude files matching pattern (can be used multiple times) |
| `--dev-bundle`        | boolean  | `false` | Build the zip bundle using Vite's dev mode                  |

## Examples

```bash
# Start development server with defaults
npx l13 dev

# Start with debug logging
npx l13 dev --debug

# Disable HTML minification for faster builds
npx l13 dev --no-html-minify

# Exclude certain files from processing
npx l13 dev --exclude "*.test.js" --exclude "docs/**"

# Use Roadroller compression
npx l13 dev --roadroller

# Build with Vite dev mode (faster, less optimized)
npx l13 dev --dev-bundle
```

## How It Works

1. **Starts Vite Dev Server**: Provides hot module replacement for fast development
2. **File Watching**: Monitors source files for changes
3. **Automatic Builds**: Triggers full builds when files change
4. **Zip Creation**: Generates compressed zip files after each build
5. **Live Reload**: Browser automatically refreshes when builds complete

## Development Workflow

1. Run `npx l13 dev`
2. Open browser to the provided URL
3. Edit your source files
4. Watch automatic rebuilds and zip creation
5. Check zip file sizes to ensure you stay under 13KB

## Environment Variables

- `DEBUG=true` - Enable debug mode
- `ROADROLLER=true` - Enable Roadroller compression
- `EXPERIMENTAL=true` - Enable experimental features

## Notes

- The server automatically excludes zip files and build artifacts from watching
- Builds are throttled to prevent excessive CPU usage
- The initial build runs immediately when the server starts
- Zip files are created in the `.lab13` directory
