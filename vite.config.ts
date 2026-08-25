import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from '@cloudflare/vite-plugin';

// The Cloudflare plugin runs worker/index.ts inside workerd during `npm run dev`,
// with the real D1 binding. There is no dev proxy and no separate wrangler process:
// http://localhost:5273/api/early-access hits the same code that ships to production.
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  server: {
    // 5173 is the game frontend's port. strictPort so a clash fails loudly
    // instead of silently drifting onto whatever port happens to be free --
    // which is how this ended up answering on the neighbour's 5174.
    port: 5273,
    strictPort: true,
    watch: {
      // The local D1 database lives under .wrangler/state. Without this, every
      // signup writes to the sqlite file, Vite sees the change and full-reloads
      // the page -- which wipes the form's success state the instant it appears
      // and makes a working submit look broken.
      ignored: ['**/.wrangler/**'],
    },
  },
});
