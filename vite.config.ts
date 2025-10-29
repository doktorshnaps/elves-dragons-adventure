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
        manualChunks: (id) => {
          // Split heavy libraries into separate chunks to reduce main thread blocking
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // UI libraries
            if (id.includes('lucide-react')) {
              return 'lucide-icons';
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            // Blockchain/Wallet libraries - split into smaller chunks
            if (id.includes('near-api-js')) {
              return 'near-api';
            }
            if (id.includes('@near-wallet-selector')) {
              return 'near-wallet-selector';
            }
            if (id.includes('wallet') || id.includes('near')) {
              return 'near-vendor';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // Other heavy libraries
            if (id.includes('recharts') || id.includes('date-fns') || id.includes('lodash')) {
              return 'utils-vendor';
            }
            // Remaining node_modules
            return 'vendor';
          }
        },
      },
    },
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'buffer',
      'stream-browserify',
      'crypto-browserify',
      'util',
      'assert',
      'process/browser',
      'readable-stream',
      'string_decoder',
      'safe-buffer',
      'process-nextick-args',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [],
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