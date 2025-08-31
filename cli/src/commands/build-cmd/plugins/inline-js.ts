import type { Plugin } from 'vite'

export function inlineJsPlugin(): Plugin {
  return {
    name: 'inline-js',
    transformIndexHtml: {
      handler(html, ctx) {
        if (!ctx.bundle) {
          return html
        }

        const inlinedAssets = new Set<string>()

        // Inline JS files - look for Vite's processed script tags
        html = html.replace(/<script[^>]*src=([^>\s]+)[^>]*><\/script>/g, (match, src) => {
          // Skip external URLs
          if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
            return match
          }

          // Remove quotes if present
          const cleanSrc = src.replace(/^["']|["']$/g, '')

          // Find the corresponding bundle file by matching the src
          const bundleKey = Object.keys(ctx.bundle!).find((key) => {
            const normalizedSrc = cleanSrc.replace(/^\//, '')
            const normalizedKey = key.replace(/^\//, '')
            return normalizedKey === normalizedSrc || key.includes(normalizedSrc)
          })

          if (bundleKey && ctx.bundle![bundleKey]) {
            const bundleItem = ctx.bundle![bundleKey]
            const jsContent = 'code' in bundleItem ? bundleItem.code : 'source' in bundleItem ? bundleItem.source : null

            if (jsContent) {
              inlinedAssets.add(bundleKey)
              return `<script>${jsContent}</script>`
            }
          }

          return match
        })

        // Remove inlined assets from the bundle
        for (const assetKey of inlinedAssets) {
          delete ctx.bundle![assetKey]
        }

        return html
      },
    },
  }
}
