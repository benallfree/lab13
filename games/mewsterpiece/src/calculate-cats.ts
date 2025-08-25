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
    console.error(`❌ Error parsing path for: ${path}`)
    console.error(`   Error: ${error}`)
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
    path: cat.path,
    bounds: {
      minX: Math.round(bounds.minX),
      minY: Math.round(bounds.minY),
      maxX: Math.round(bounds.maxX),
      maxY: Math.round(bounds.maxY),
    },
  }
})

// Generate the new cats.ts content
const newCatsContent = `export const cats: any = ${JSON.stringify(results, null, 2)}`

// Write the updated content back to cats.ts
try {
  fs.writeFileSync('./cats.ts', newCatsContent)
  console.log(`✅ Calculated bounds for ${results.length} cats`)
  console.log(`📁 Updated cats.ts`)
} catch (error) {
  console.error(`❌ Failed to write file: ${error}`)
  process.exit(1)
}

// Display summary
console.log('\n📊 Summary:')
results.forEach((cat) => {
  const width = cat.bounds.maxX - cat.bounds.minX
  const height = cat.bounds.maxY - cat.bounds.minY
  console.log(
    `  ${cat.name}: ${width}x${height} (bounds: ${cat.bounds.minX},${cat.bounds.minY} to ${cat.bounds.maxX},${cat.bounds.maxY})`
  )
})
