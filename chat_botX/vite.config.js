import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dotenv from 'dotenv';
dotenv.config();

const VITE_BACKEND_URL = process.env.VITE_BACKEND_URL;
// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/logout": VITE_BACKEND_URL
    }
  },
  plugins: [react(),tailwindcss()]
})
