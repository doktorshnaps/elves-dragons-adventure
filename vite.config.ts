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
    }),
  ].filter(Boolean),
  base: "./",
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
  optimizeDeps: {
    include: [
      'buffer',
      'stream-browserify',
      'crypto-browserify',
      'util',
      'assert',
      'process',
      'readable-stream',
      'string_decoder',
      'safe-buffer',
      'process-nextick-args',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
}));