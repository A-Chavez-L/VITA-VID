import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 🌐 Expone el servidor a tu IP local para que tu tablet pueda conectarse
    port: 5173  // Mantiene el puerto estándar de desarrollo
  }
})