import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Core React runtime — loaded first, cached forever
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'vendor';
          }
          // Redux — only needed after login
          if (id.includes('node_modules/@reduxjs') || id.includes('node_modules/react-redux')) {
            return 'redux';
          }
          // Framer Motion — only needed in dashboard/landing animations
          if (id.includes('node_modules/framer-motion')) {
            return 'motion';
          }
          // Charts — only needed in dashboard
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'charts';
          }
          // Landing page — large file, keep separate so dashboard doesn't pull it in
          if (id.includes('pages/public/Landing') || id.includes('pages/public/AuthDialog')) {
            return 'landing';
          }
          // Admin pages — only loaded by admins
          if (id.includes('pages/admin/')) {
            return 'admin';
          }
        },
      },
    },
  },
})
