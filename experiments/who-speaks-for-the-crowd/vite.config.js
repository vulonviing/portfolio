import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/who-speaks-for-the-crowd/',
  plugins: [react()],
  build: {
    outDir: '../../who-speaks-for-the-crowd',
    emptyOutDir: true,
  },
});
