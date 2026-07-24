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
    schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Autoniv?',
          acceptedAnswer: { '@type': 'Answer', text: 'Autoniv is an AI platform providing 24/7 voice agents and chatbots that handle customer calls, support, lead qualification, and appointment scheduling in 20+ languages.' }
        },
        {
          '@type': 'Question',
          name: 'Does Autoniv support Indian languages?',
          acceptedAnswer: { '@type': 'Answer', text: 'Yes, Autoniv supports English, Hindi, Tamil, Telugu, Kannada, Bengali, and 20+ international languages with natural inflection and low latency.' }
        },
        {
          '@type': 'Question',
          name: 'How does Autoniv pricing compare to traditional call centers?',
          acceptedAnswer: { '@type': 'Answer', text: 'Autoniv reduces customer support and lead qualification costs by up to 70% with transparent monthly plans starting at ₹4,999/month ($49/month).' }
        }
      ]
    }
  },
  '/ai-voice-agent': {
    title: 'AI Voice Agents for Business Automation | Autoniv',
    description: 'Deploy intelligent, natural-sounding AI voice agents to automate inbound & outbound customer calls, qualify leads, and schedule appointments 24/7.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'AI Voice Agent',
      provider: { '@type': 'Organization', name: 'Autoniv' },
      description: 'AI-powered voice agents that answer calls, book appointments, and capture leads 24/7.',
      areaServed: 'Global'
    }
  },
  '/ai-chatbot': {
    title: 'Intelligent AI Chatbots & Customer Assistants | Autoniv',
    description: 'Engage website visitors and automate customer support with AI chatbots that handle sales inquiries, support tickets, and leads in 20+ languages.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'AI Chatbot',
      provider: { '@type': 'Organization', name: 'Autoniv' },
      description: 'AI chatbots that engage website visitors, answer questions, and convert leads automatically.',
      areaServed: 'Global'
    }
  },
  '/ai-phone-answering': {
    title: '24/7 AI Phone Answering Service & Receptionist | Autoniv',
    description: 'Automate your front desk with an intelligent AI phone receptionist. Handle unlimited concurrent calls, filter spam, and transfer to humans when needed.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'AI Phone Answering',
      provider: { '@type': 'Organization', name: 'Autoniv' },
      description: 'Automated phone answering service that handles calls, takes messages, and routes inquiries.',
      areaServed: 'Global'
    }
  },
  '/appointment-booking': {
    title: 'Automated AI Appointment Booking & Scheduling | Autoniv',
    description: 'Let AI schedule, reschedule, and manage client bookings directly over voice calls and chat. Direct real-time calendar and CRM integrations.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'AI Appointment Booking',
      provider: { '@type': 'Organization', name: 'Autoniv' },
      description: 'AI-powered appointment scheduling that books meetings, sends confirmations, and manages calendars.',
      areaServed: 'Global'
    }
  },
  '/customer-support': {
    title: 'AI-Powered Customer Support Automation | Autoniv',
    description: 'Streamline support workflows with AI voice and chat assistants that resolve up to 80% of customer FAQs instantly, reducing operations cost by 70%.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Customer Support Automation',
      provider: { '@type': 'Organization', name: 'Autoniv' },
      description: 'Automate tier-1 support tickets and FAQs across voice and chat channels.',
      areaServed: 'Global'
    }
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

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function swapMeta(html, routePath, meta) {
  const url = routePath === '/' ? DOMAIN : `${DOMAIN}${routePath}`;
  const escapedTitle = escapeAttr(meta.title);
  const escapedDesc = escapeAttr(meta.description);

  let result = html;

  // Replace <title>
  result = result.replace(/<title>[^<]*<\/title>/, `<title>${escapedTitle}</title>`);

  // Replace meta description
  result = result.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapedDesc}" />`
  );

  // Replace canonical
  result = result.replace(
    /<link\s+id="canonical-link"\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${url}" />`
  );

  // Replace og:url
  result = result.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${url}" />`
  );

  // Replace og:title
  result = result.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${escapedTitle}" />`
  );

  // Replace og:description
  result = result.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escapedDesc}" />`
  );

  // Replace twitter:url
  result = result.replace(
    /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:url" content="${url}" />`
  );

  // Replace twitter:title
  result = result.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${escapedTitle}" />`
  );

  // Replace twitter:description
  result = result.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escapedDesc}" />`
  );

  // Inject route-specific JSON-LD Schema
  if (meta.schema) {
    const schemaScript = `  <script type="application/ld+json">\n${JSON.stringify(meta.schema, null, 2)}\n  </script>`;
    result = result.replace('</head>', `${schemaScript}\n</head>`);
  }

  return result;
}

// Read the Vite-built index.html as template (has correct /assets/*.js references)
const templatePath = path.join(distDir, 'index.html');
const templateHtml = fs.readFileSync(templatePath, 'utf8');

const prerenderedPaths = [];

for (const [routePath, meta] of Object.entries(EXACT_META)) {
  const routeHtml = swapMeta(templateHtml, routePath, meta);

  if (routePath === '/') {
    fs.writeFileSync(templatePath, routeHtml, 'utf8');
    console.log(`  Updated: index.html (route: /)`);
  } else {
    const dirPath = path.join(distDir, routePath);
    fs.mkdirSync(dirPath, { recursive: true });
    const filePath = path.join(dirPath, 'index.html');
    fs.writeFileSync(filePath, routeHtml, 'utf8');
    console.log(`  Generated: ${routePath}/index.html`);
  }
  prerenderedPaths.push(routePath);
}

console.log(`\nPrerendered ${prerenderedPaths.length} routes with correct JS/CSS references.`);
