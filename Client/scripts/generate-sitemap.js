import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = 'https://autoniv.com';
const lastmod = new Date().toISOString().split('T')[0];

const routes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/ai-voice-agent', priority: '0.9', changefreq: 'weekly' },
  { path: '/ai-chatbot', priority: '0.9', changefreq: 'weekly' },
  { path: '/ai-phone-answering', priority: '0.8', changefreq: 'weekly' },
  { path: '/appointment-booking', priority: '0.8', changefreq: 'weekly' },
  { path: '/customer-support', priority: '0.8', changefreq: 'weekly' },
  { path: '/industries/real-estate', priority: '0.8', changefreq: 'weekly' },
  { path: '/industries/healthcare', priority: '0.8', changefreq: 'weekly' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/pricing', priority: '0.9', changefreq: 'monthly' },
  { path: '/pricing/voice-assistance', priority: '0.9', changefreq: 'monthly' },
  { path: '/pricing/ai-chatbot', priority: '0.9', changefreq: 'monthly' },
  { path: '/help', priority: '0.7', changefreq: 'weekly' },
  { path: '/blog', priority: '0.8', changefreq: 'daily' },
  { path: '/press', priority: '0.6', changefreq: 'monthly' },
  { path: '/careers', priority: '0.7', changefreq: 'weekly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/services', priority: '0.8', changefreq: 'weekly' },
  { path: '/case-studies', priority: '0.8', changefreq: 'weekly' },
  { path: '/news', priority: '0.8', changefreq: 'weekly' }
];

const xmlItems = routes.map(route => `  <url>
    <loc>${DOMAIN}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n');

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlItems}
</urlset>`;

const destPath = path.resolve(__dirname, '../public/sitemap.xml');
fs.writeFileSync(destPath, sitemapXml, 'utf8');
console.log('Sitemap generated successfully at:', destPath);
