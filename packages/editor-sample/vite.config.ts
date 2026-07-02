import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    // The src tree contains stale compiled .js artifacts next to the .tsx
    // sources. Vite's default extension order prefers .js, which silently
    // serves the outdated compiled copies. Prefer TypeScript sources.
    extensions: ['.tsx', '.ts', '.jsx', '.mjs', '.js', '.json'],
  },
  build: {
    outDir: 'dist',
  },
});
