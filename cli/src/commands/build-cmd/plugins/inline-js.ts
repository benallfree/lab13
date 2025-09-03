import type { Plugin } from 'vite'

export type InlineJsPluginOptions = {
  debug?: boolean
}

export function inlineJsPlugin(options: InlineJsPluginOptions = {}): Plugin {
  const { debug = false } = options
  const dbg = (...args: any[]) => (debug ? console.log(`[DEBUG] [inline-js]`, ...args) : undefined)
  return {
    name: 'inline-js',
    transformIndexHtml: {
      handler(html, ctx) {
        if (!ctx.bundle) {
          return html
        }

        dbg('Inlining JS in index.html')

        const inlinedAssets = new Set<string>()

        dbg(`before`, html)
        // Inline JS files - look for Vite's processed script tags
        html = html.replace(/<script[^>]*src=([^>\s]+)[^>]*><\/script>/g, (match, src) => {
          // Skip external URLs
          if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
            dbg(`Skipping external JS: ${src}`)
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
              dbg(`Inlining JS: ${bundleKey}`)
              inlinedAssets.add(bundleKey)
              return `<script type="module">${jsContent}</script>`
            }
          }

          return match
        })

        // Remove inlined assets from the bundle
        for (const assetKey of inlinedAssets) {
          dbg(`Removing bundle JS: ${assetKey}`)
          delete ctx.bundle![assetKey]
        }

        dbg(`after`, html)

        return html
      },
    },
  }
}
