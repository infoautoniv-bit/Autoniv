import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    chunkSizeWarningLimit: 1000,
    sourcemap: process.env.NODE_ENV !== 'production',
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
          // Landing page & public pages — granular splitting so public visitors only download what they view
          if (id.includes('pages/public/Landing') || id.includes('pages/public/AuthDialog')) {
            return 'landing';
          }
          if (id.includes('pages/public/Pricing') || id.includes('pages/public/VoiceAssistancePricing') || id.includes('pages/public/AiChatbotPricing')) {
            return 'public-pricing';
          }
          if (id.includes('pages/public/Blog') || id.includes('pages/public/News') || id.includes('pages/public/Press')) {
            return 'public-news';
          }
          if (id.includes('pages/public/CaseStudies') || id.includes('pages/public/CaseStudyDetail')) {
            return 'public-cases';
          }
          if (id.includes('pages/public/')) {
            return 'public-misc';
          }
          // Admin pages — split individually so admin modules are never fetched on public pages
          if (id.includes('pages/admin/AdminUsers')) {
            return 'admin-users';
          }
          if (id.includes('pages/admin/AdminAgents')) {
            return 'admin-agents';
          }
          if (id.includes('pages/admin/AdminCalls')) {
            return 'admin-calls';
          }
          if (id.includes('pages/admin/')) {
            return 'admin-core';
          }
        },
      },
    },
  },
})
