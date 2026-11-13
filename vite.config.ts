import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import fs from 'node:fs';

/** Dev-only: the debug clip recorder (src/services/clipRecorder.ts) POSTs finished clips here. */
function clipSaver(): Plugin {
  return {
    name: 'debug-clip-saver',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__debug/save-clip', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        const raw = new URL(req.url ?? '', 'http://x').searchParams.get('name') ?? 'clip.webm';
        const name = path.basename(raw).replace(/[^\w.-]/g, '_');
        const dir = path.resolve(__dirname, 'recordings');
        fs.mkdirSync(dir, { recursive: true });
        const out = fs.createWriteStream(path.join(dir, name));
        req.pipe(out);
        out.on('finish', () => res.end('ok'));
        out.on('error', () => {
          res.statusCode = 500;
          res.end();
        });
      });
    },
  };
}

export default defineConfig({
  // Relative base so the build works under any GitHub Pages sub-path (/<repo>/). Routing is hash-based.
  base: './',
  plugins: [react(), tailwindcss(), clipSaver()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          gsap: ['gsap', '@gsap/react'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
} as Parameters<typeof defineConfig>[0]);
