import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works from a domain root or a GitHub Pages
// project path (username.github.io/repo-name/) without changes.
export default defineConfig({
  base: './',
  plugins: [react()],
});
