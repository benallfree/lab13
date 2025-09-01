---
sidebar_position: 2
---

# Lab13 CLI (`l13`)

The Lab13 CLI (`l13`) is a command-line tool designed specifically for JS13K game development. It provides a streamlined workflow for creating, building, and testing games that fit within the 13KB size constraint.

## Installation

```bash
npm install -g l13
```

Or use with npx:

```bash
npx l13 --help
```

## Quick Start

1. **Create a new game project:**

   ```bash
   npx l13 create
   ```

2. **Start development server:**

   ```bash
   npx l13 dev
   ```

3. **Build for production:**

   ```bash
   npx l13 build
   ```

4. **Preview the built game:**
   ```bash
   npx l13 preview
   ```

## Features

- **Project Scaffolding**: Create new games from official examples
- **Development Server**: Hot-reload development with automatic builds
- **Optimized Builds**: Advanced compression and minification for JS13K
- **Multiple Compression Methods**: Support for various compression algorithms
- **Asset Inlining**: Automatic CSS and JS inlining
- **Size Optimization**: Built-in tools to help stay under 13KB

## Commands

- [`create`](./commands/create.md) - Scaffold a new project from examples
- [`dev`](./commands/dev.md) - Start development server with hot reload
- [`build`](./commands/build.md) - Build optimized production bundle
- [`preview`](./commands/preview.md) - Serve built files locally

## Environment Variables

- `DEBUG` - Enable debug logging
- `ROADROLLER` - Enable Roadroller compression
- `EXPERIMENTAL` - Enable experimental compression methods
