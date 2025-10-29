import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    nodePolyfills({
      include: ['buffer', 'stream', 'crypto', 'util', 'assert', 'process'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ].filter(Boolean),
  base: "./",
  define: {
    'global': 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer",
      stream: "stream-browserify",
      crypto: "crypto-browserify",
      util: "util",
      assert: "assert",
      process: "process/browser",
    },
  },
  build: {
    // Enable minification with esbuild for optimal compression
    minify: 'esbuild',
    // Enable CSS code splitting to reduce unused CSS
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: undefined, // Disable all manual chunking to prevent React init issues
      },
    },
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'buffer',
      'process/browser',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  esbuild: {
    // More conservative minification to avoid breaking NEAR wallet selector
    legalComments: 'none',
    minifyIdentifiers: false, // Отключаем минификацию идентификаторов для NEAR
    minifySyntax: true,
    minifyWhitespace: true,
  },
}));