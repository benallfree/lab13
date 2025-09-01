---
title: Preview Command
sidebar_position: 4
---

# `l13 preview`

Serve the built `dist/` directory with Express for local testing.

## Usage

```bash
npx l13 preview
```

## Description

The `preview` command starts a local Express server to serve your built game files. This is useful for testing your final build before submission, ensuring everything works correctly in a production-like environment.

## How It Works

1. **Serves `dist/` Directory**: Serves all files from the `dist` folder
2. **Express Server**: Uses Express.js for reliable local hosting
3. **Static File Serving**: Serves HTML, CSS, JS, and other assets
4. **Local Access**: Provides a local URL for testing

## Examples

```bash
# Serve the built files
npx l13 preview

# Typical output:
# Server running at http://localhost:3000
# Press Ctrl+C to stop
```

## Use Cases

- **Final Testing**: Test your game after building
- **Performance Testing**: Check loading times and performance
- **Cross-browser Testing**: Test in different browsers
- **Submission Preparation**: Verify everything works before submitting

## Workflow

1. Build your game: `npx l13 build`
2. Preview the build: `npx l13 preview`
3. Open browser to the provided URL
4. Test all game functionality
5. Check file sizes and performance

## Notes

- Make sure to run `npx l13 build` first to create the `dist/` directory
- The server runs on a default port (typically 3000)
- Press `Ctrl+C` to stop the server
- This is a simple static file server - no hot reload or development features
