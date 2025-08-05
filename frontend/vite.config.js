import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // No need for multiple entry points anymore!
  build: {
    rollupOptions: {
      input: {
        main: 'index.html'  // Single entry point
      }
    }
  }
});