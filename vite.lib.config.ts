import { fileURLToPath, URL } from 'node:url'
import { relative, extname } from 'path'
import { globSync } from 'glob'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// Be specific about which files to include in the library build.
const libraryEntryPoints = [
  'src/**/*.ts',
  'src/styles/core.css',
  'src/styles/*Plugin.css'
]

const libraryFiles = globSync(libraryEntryPoints, { ignore: ['src/main.ts'] })

export default defineConfig({
  publicDir: false,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts']
    })
  ],
  build: {
    outDir: 'lib',
    emptyOutDir: true,
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      format: {
        comments: false
      }
    },
    lib: {
      entry: Object.fromEntries(
        libraryFiles.map(file => [
          relative('src', file.slice(0, file.length - extname(file).length)),
          fileURLToPath(new URL(file, import.meta.url))
        ])
      ),
      formats: ['es']
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const firstName = assetInfo.names?.[0]

          if (firstName && firstName.endsWith('.css')) {
            return `styles/${firstName.split('/').pop()}`
          }

          return 'assets/[name][extname]'
        }
      }
    }
  }
})
