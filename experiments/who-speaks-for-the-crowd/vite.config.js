import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: mode === 'operator' ? '/operator-deck/' : '/who-speaks-for-the-crowd/',
  plugins: [
    react(),
    {
      name: 'operator-token-meta',
      transformIndexHtml(html) {
        return mode === 'operator' ? html : html.replace(/\s*<meta name="local-token" content="__LOCAL_TOKEN__" \/>/, '');
      },
    },
  ],
  build: {
    outDir: mode === 'operator' ? 'dist-operator' : '../../who-speaks-for-the-crowd',
    emptyOutDir: true,
  },
}));
