import CleanCSS from 'clean-css'
import type { Plugin } from 'vite'

export function inlineCssPlugin(): Plugin {
  return {
    name: 'inline-css',
    transformIndexHtml: {
      handler(html, ctx) {
        if (!ctx.bundle) {
          return html
        }

        const inlinedAssets = new Set<string>()

        // Inline CSS files - look for Vite's processed CSS links
        html = html.replace(/<link[^>]*rel=stylesheet[^>]*>/g, (match) => {
          // Extract href from the link tag
          const hrefMatch = match.match(/href=([^>\s]+)/)
          if (!hrefMatch || !hrefMatch[1]) return match

          const href = hrefMatch[1]

          // Skip external URLs
          if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
            return match
          }

          // Remove quotes if present
          const cleanHref = href.replace(/^["']|["']$/g, '')

          // Find the corresponding bundle file by matching the href
          const bundleKey = Object.keys(ctx.bundle!).find((key) => {
            const normalizedHref = cleanHref.replace(/^\//, '')
            const normalizedKey = key.replace(/^\//, '')
            return normalizedKey === normalizedHref || key.includes(normalizedHref)
          })

          if (bundleKey && ctx.bundle![bundleKey]) {
            const bundleItem = ctx.bundle![bundleKey]
            const cssContent =
              'code' in bundleItem ? bundleItem.code : 'source' in bundleItem ? bundleItem.source : null

            if (cssContent) {
              inlinedAssets.add(bundleKey)
              const minifiedCss = new CleanCSS({ level: 2 }).minify(cssContent as string).styles
              return `<style>${minifiedCss}</style>`
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
