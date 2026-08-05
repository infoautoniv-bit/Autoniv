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
    cssCodeSplit: false,
    chunkSizeWarningLimit: 1000,
    sourcemap: 'hidden',
   
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

          // Feature product pages
          if (
            id.includes('pages/public/AiVoiceAgent') ||
            id.includes('pages/public/AiChatbot') ||
            id.includes('pages/public/AiPhoneAnswering') ||
            id.includes('pages/public/AppointmentBooking') ||
            id.includes('pages/public/CustomerSupportPublic') ||
            id.includes('pages/public/RealEstateIndustry') ||
            id.includes('pages/public/HealthcareIndustry')
          ) {
            return 'public-features';
          }
          // Pricing pages
          if (id.includes('pages/public/Pricing') || id.includes('pages/public/VoiceAssistancePricing') || id.includes('pages/public/AiChatbotPricing')) {
            return 'public-pricing';
          }
          // Content pages (Blog, News, Press)
          if (id.includes('pages/public/Blog') || id.includes('pages/public/News') || id.includes('pages/public/Press')) {
            return 'public-news';
          }
          // Case studies
          if (id.includes('pages/public/CaseStudies') || id.includes('pages/public/CaseStudyDetail')) {
            return 'public-cases';
          }
          // Shared UI components — separate from admin pages
          if (id.includes('src/components/')) {
            return 'shared-components';
          }
          // Admin pages — split individually so admin modules are never fetched on public pages
          if (id.includes('src/pages/admin/AdminUsers')) {
            return 'admin-users';
          }
          if (id.includes('src/pages/admin/AdminAgents')) {
            return 'admin-agents';
          }
          if (id.includes('src/pages/admin/AdminCalls')) {
            return 'admin-calls';
          }
          if (id.includes('src/pages/admin/')) {
            return 'admin-core';
          }
        },
      },
    },
  },
})
