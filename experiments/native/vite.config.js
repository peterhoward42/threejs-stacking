import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const experimentRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(experimentRoot, '../..');

export default defineConfig({
  plugins: [svelte()],
  server: {
    fs: {
      allow: [experimentRoot, repoRoot],
    },
  },
});
