#!/usr/bin/env node

import fs from 'fs'
import getPathBounds from 'svg-path-bounds'
import { cats } from './cats.js'

// Function to calculate bounding box using svg-path-bounds
function calculatePathBounds(path: string) {
  try {
    const bounds = getPathBounds(path)
    return {
      width: bounds[2] - bounds[0],
      height: bounds[3] - bounds[1],
      minX: bounds[0],
      minY: bounds[1],
      maxX: bounds[2],
      maxY: bounds[3],
    }
  } catch (error) {
    console.error(`Error parsing path for: ${path}`)
    return {
      width: 0,
      height: 0,
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
    }
  }
}

// Process each cat and calculate dimensions
const results = cats.map((cat) => {
  const bounds = calculatePathBounds(cat.path)
  return {
    name: cat.name,
    ttl: cat.ttl,
    path: cat.path,
    width: Math.round(bounds.width),
    height: Math.round(bounds.height),
    bounds: {
      minX: Math.round(bounds.minX),
      minY: Math.round(bounds.minY),
      maxX: Math.round(bounds.maxX),
      maxY: Math.round(bounds.maxY),
    },
  }
})

// Write results to cats.json
const outputPath = './cats.json'
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))

console.log(`✅ Calculated dimensions for ${results.length} cats`)
console.log(`📁 Results written to ${outputPath}`)

// Display summary
results.forEach((cat) => {
  console.log(`${cat.name}: ${cat.width}x${cat.height}`)
})
