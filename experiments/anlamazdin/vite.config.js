import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/anlamazdin/',
  plugins: [react()],
  build: {
    outDir: '../../anlamazdin',
    emptyOutDir: true,
  },
});
