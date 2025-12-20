import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3016,
    allowedHosts: ['.dev.ecoworks.ca', 'localhost'],
    host: true,
  },
})
