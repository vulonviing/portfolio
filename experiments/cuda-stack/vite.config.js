import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/cuda-stack/',
  plugins: [react()],
  build: {
    outDir: '../../cuda-stack',
    emptyOutDir: true,
  },
});
