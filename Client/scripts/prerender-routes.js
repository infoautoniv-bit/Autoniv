import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = 'https://autoniv.com';
const distDir = path.resolve(__dirname, '../dist');

const EXACT_META = {
  '/': {
    title: 'Autoniv | 24/7 AI Assistance for Businesses in 20+ Languages',
    description: 'Autoniv provides 24/7 AI assistance for businesses with AI voice agents and chatbots, supporting customer calls, support, sales, & inquiries in 20+ languages. Start free.',
  },
  '/ai-voice-agent': {
    title: 'AI Voice Agents for Business Automation | Autoniv',
    description: 'Deploy intelligent, natural-sounding AI voice agents to automate inbound & outbound customer calls, qualify leads, and schedule appointments 24/7.',
  },
  '/ai-chatbot': {
    title: 'Intelligent AI Chatbots & Customer Assistants | Autoniv',
    description: 'Engage website visitors and automate customer support with AI chatbots that handle sales inquiries, support tickets, and leads in 20+ languages.',
  },
  '/ai-phone-answering': {
    title: '24/7 AI Phone Answering Service & Receptionist | Autoniv',
    description: 'Automate your front desk with an intelligent AI phone receptionist. Handle unlimited concurrent calls, filter spam, and transfer to humans when needed.',
  },
  '/appointment-booking': {
    title: 'Automated AI Appointment Booking & Scheduling | Autoniv',
    description: 'Let AI schedule, reschedule, and manage client bookings directly over voice calls and chat. Direct real-time calendar and CRM integrations.',
  },
  '/customer-support': {
    title: 'AI-Powered Customer Support Automation | Autoniv',
    description: 'Streamline support workflows with AI voice and chat assistants that resolve up to 80% of customer FAQs instantly, reducing operations cost by 70%.',
  },
  '/industries/real-estate': {
    title: 'AI Agents for Real Estate Automation | Autoniv',
    description: 'Qualify property leads, schedule home viewings, and follow up with buyers 24/7 using tailored AI voice agents and chatbots for real estate.',
  },
  '/industries/healthcare': {
    title: 'HIPAA-Compliant AI Voice & Chat for Healthcare | Autoniv',
    description: 'Automate patient intake, appointment scheduling, prescription refills, and follow-ups with secure, intelligent healthcare AI assistants.',
  },
  '/privacy': {
    title: 'Privacy Policy - Autoniv',
    description: 'Read the privacy policy of Autoniv. Learn how we handle, process, and protect your enterprise data under international and local regulations.',
  },
  '/terms': {
    title: 'Terms & Conditions - Autoniv',
    description: 'Review the terms of service governing the use of the Autoniv platform, AI agents, and billing systems.',
  },
  '/help': {
    title: 'Help Center & Documentation | Autoniv',
    description: 'Access support, documentation, API guides, and tutorials to configure and optimize your Autoniv AI voice and chat assistants.',
  },
  '/about': {
    title: 'About Us - The Team Behind Autoniv AI',
    description: 'Learn about our mission to make state-of-the-art conversational AI technology accessible and cost-effective for businesses globally.',
  },
  '/careers': {
    title: 'Careers - Join the Autoniv Team',
    description: 'Explore open roles and career opportunities at Autoniv. Help us build the future of autonomous voice and chat AI assistants.',
  },
  '/blog': {
    title: 'Autoniv Blog - AI Voice Technology & Business Automation',
    description: 'Read the latest insights, strategies, and trends on conversational AI, voice agents, chatbots, and business process automation.',
  },
  '/press': {
    title: 'Press Room & Media Kit | Autoniv',
    description: 'Get the latest press releases, media coverage, and brand assets for Autoniv.',
  },
  '/services': {
    title: 'AI Voice & Chat Solutions for Enterprise | Autoniv',
    description: 'Explore our full suite of autonomous voice agents, chat assistants, and business automation integrations.',
  },
  '/case-studies': {
    title: 'Success Stories & Customer Case Studies | Autoniv',
    description: 'Discover how businesses across healthcare, real estate, finance, and e-commerce achieve 70% cost reduction and 3x lead growth with Autoniv.',
  },
  '/pricing': {
    title: 'Pricing Plans - Autoniv',
    description: 'Choose the right plan for your business. Start free with 100 conversations per month, no credit card required, and scale as you grow.',
  },
  '/pricing/voice-assistance': {
    title: 'AI Voice Agent Pricing - Plans from Rs.4,999/mo | Autoniv',
    description: 'Compare AI voice agent pricing plans from Rs.4,999/month. See features, add-ons, and a free ROI calculator. No hidden fees, 30-day money-back guarantee.',
  },
  '/pricing/ai-chatbot': {
    title: 'AI Chatbot Pricing | Autoniv',
    description: 'Compare Autoniv AI chatbot pricing for Website, WhatsApp, Instagram & Facebook automation. Plans from free to enterprise. Start free.',
  },
  '/news': {
    title: 'Latest News - Autoniv',
    description: 'Stay updated with product announcements, brand news, and major updates from the Autoniv team.',
  },
};

const NOINDEX_ROUTES = ['/dashboard', '/admin', '/onboarding'];

function shouldNoindex(route) {
  return NOINDEX_ROUTES.some((prefix) => route.startsWith(prefix));
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function generateRouteHtml(routePath, meta) {
  const url = routePath === '/' ? DOMAIN : `${DOMAIN}${routePath}`;
  const robotsContent = shouldNoindex(routePath) ? 'noindex, nofollow' : 'index, follow';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/webp" href="/apple-touch-icon.webp" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="google-site-verification" content="%VITE_GOOGLE_SITE_VERIFICATION%" />

  <title>${escapeAttr(meta.title)}</title>
  <meta name="description" content="${escapeAttr(meta.description)}" />
  <meta name="robots" content="${robotsContent}" />
  <link rel="canonical" href="${url}" />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${escapeAttr(meta.title)}" />
  <meta property="og:description" content="${escapeAttr(meta.description)}" />
  <meta property="og:image" content="${DOMAIN}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Autoniv" />
  <meta property="og:locale" content="en_US" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${url}" />
  <meta name="twitter:title" content="${escapeAttr(meta.title)}" />
  <meta name="twitter:description" content="${escapeAttr(meta.description)}" />
  <meta name="twitter:image" content="${DOMAIN}/og-image.png" />

  <!-- Geo Targeting -->
  <meta name="geo.region" content="IN" />
  <meta name="geo.placename" content="India" />

  <!-- Favicon Variants -->
  <link rel="apple-touch-icon" href="/apple-touch-icon.webp" />
  <meta name="theme-color" content="#050d1a" />

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Autoniv",
      "url": "${DOMAIN}",
      "logo": "${DOMAIN}/logo.png",
      "description": "AI-powered voice agents, chatbots, and phone answering services for businesses.",
      "sameAs": [
        "https://twitter.com/autoniv",
        "https://linkedin.com/company/autoniv",
        "https://facebook.com/autoniv"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": "hello@autoniv.com",
        "telephone": "+91-7065990307",
        "availableLanguage": ["English", "Hindi", "Spanish", "French"]
      },
      "areaServed": "Global",
      "knowsLanguage": ["en", "es", "fr", "de", "it", "pt", "hi", "ar", "ja", "ko"]
    }
  </script>
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Autoniv",
      "url": "${DOMAIN}",
      "description": "Deploy intelligent AI voice agents that handle calls 24/7 in 20+ languages."
    }
  </script>

  <!-- Bing Webmaster Tools -->
  <meta name="msvalidate.01" content="%VITE_BING_VERIFICATION%" />

  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-96TS2V6N6H"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-96TS2V6N6H');
  </script>
</head>
<body>
  <div id="root"></div>
  <div id="fb-root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
}

const prerenderedPaths = [];

for (const [routePath, meta] of Object.entries(EXACT_META)) {
  if (routePath === '/') {
    const filePath = path.join(distDir, 'index.html');
    const html = generateRouteHtml(routePath, meta);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`  Generated: index.html (route: /)`);
  } else {
    const dirPath = path.join(distDir, routePath);
    fs.mkdirSync(dirPath, { recursive: true });
    const filePath = path.join(dirPath, 'index.html');
    const html = generateRouteHtml(routePath, meta);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`  Generated: ${routePath}/index.html`);
  }
  prerenderedPaths.push(routePath);
}

const manifestPath = path.join(distDir, '_prerender-manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(prerenderedPaths, null, 2), 'utf8');

console.log(`\nPrerendered ${prerenderedPaths.length} routes. Manifest saved.`);
