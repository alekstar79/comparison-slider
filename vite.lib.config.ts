import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  mode: 'production',
  publicDir: false,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    extensions: ['.ts']
  },
  plugins: [
    dts({
      rollupTypes: true,
      include: ['src/**/*.ts']
    })
  ],
  build: {
    target: 'es2022',
    outDir: 'lib',
    emptyOutDir: true,
    reportCompressedSize: false,
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ComparisonSlider',
      formats: ['es']
    },
    rollupOptions: {
      input: resolve(__dirname, 'src/index.ts'),
      output: {
        dir: 'lib',
        format: 'es',
        preserveModulesRoot: 'src',
        preserveModules: true,
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]'
      }
    }
  }
})
