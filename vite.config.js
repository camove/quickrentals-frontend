import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    target: "esnext",  // Asigură compatibilitatea cu modulele ES6
    assetsInlineLimit: 0,  // Previne încapsularea resurselor în Base64
  },
});

