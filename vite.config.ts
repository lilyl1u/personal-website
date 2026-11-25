import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://lilyl1u.github.io/personal-website/. Override with
// BASE_PATH=/ when deploying to a domain root (Netlify, Vercel, custom domain).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/personal-website/',
  plugins: [react()],
});
