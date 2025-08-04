import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        chatbot: path.resolve(__dirname, 'chatbot.html'),
        conversationmanager: path.resolve(__dirname, 'conversationmanager.html'),
        filemanager: path.resolve(__dirname, 'filemanager.html'),

      }
    }
  }
});
