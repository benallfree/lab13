# useDemo Tutorial

The `useDemo` hook is a powerful tool for creating interactive demos of your Lab 13 games. It allows you to showcase your game in multiple iframes simultaneously, making it perfect for demonstrating multiplayer functionality, testing different scenarios, or creating engaging presentations.

## Overview

When you add `?demo` to your game's URL, `useDemo` transforms your single-player game into a multi-instance demo environment. It hides the main canvas and creates a flexible interface where you can add multiple game instances, each running independently.

## Basic Usage

Here's how to implement `useDemo` in your game:

```typescript
import { useDemo } from 'lab13-sdk'

function main() {
  // Your game logic here
  // ...
}

// Handle demo mode or start the game after DOM is loaded
if (location.search.includes('demo') && import.meta.env.DEV) {
  useDemo()
} else {
  main()
}
```

## How It Works

### Demo Mode Detection

The hook automatically detects demo mode by checking if the URL contains `?demo`:

```typescript
const isDemoMode = location.search.includes('demo')
```
