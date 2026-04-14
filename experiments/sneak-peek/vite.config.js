import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/sneak-peek/',
  plugins: [react()],
  build: {
    outDir: '../../sneak-peek',
    emptyOutDir: true,
  },
});
