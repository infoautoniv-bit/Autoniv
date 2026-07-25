# Autoniv — AI Voice Agent & Chatbot SaaS Platform

Autoniv is a professional **multi-tenant SaaS platform** for managing AI voice agents (powered by [Vapi](https://vapi.ai)) and AI chatbots. It lets businesses deploy intelligent voice assistants and chat widgets while administrators retain full platform control — usage limits, plans, billing, and add-ons.

The product ships with two distinct feature families:

- **Voice plans** — AI voice agents with call handling, transcripts, recordings, lead capture, and appointment booking.
- **Chat plans** — AI chatbots with conversations, WhatsApp integration, and multi-channel support.

The experience is designed as a premium enterprise SaaS tool — clean, powerful, and trustworthy — with a dark, Indigo/Violet aesthetic (think Linear meets Vercel dashboard).

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Backend](#backend)
  - [Data Models](#data-models)
  - [API Routes](#api-routes)
  - [Services](#services)
  - [Middleware & Security](#middleware--security)
  - [Custom Voice Orchestrator](#custom-voice-orchestrator)
- [Frontend](#frontend)
  - [Routing](#routing)
  - [Pages](#pages)
  - [Components](#components)
  - [State Management](#state-management)
- [Website Content & Feature Breakdown](#website-content--feature-breakdown)
- [Plan System](#plan-system)
- [Vapi Integration](#vapi-integration)
- [Design System](#design-system)

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 19, TypeScript, Vite 8, TailwindCSS 4, Redux Toolkit, React Router v7, Framer Motion, Recharts |
| **Backend** | Node.js, Express 4 (ESM), MongoDB + Mongoose 8, WebSocket (`ws`) |
| **Auth** | JWT access + refresh tokens (httpOnly cookies), bcrypt, OTP verification, Google login |
| **Voice** | Vapi (managed) + a custom in-house WebSocket orchestrator (Deepgram STT, LLM, TTS) |
| **AI / LLM** | OpenAI, Groq, ElevenLabs TTS |
| **Localization** | Google Translate integration with 130+ world languages modal, auto-detection & cookie persistence |
| **Messaging** | WhatsApp, Twilio (media streams), Resend / MailerSend / Nodemailer (email) |
| **Docs / Reports** | PDFKit (PDF report generation) |

---

## Repository Layout

```
Saas/
├── backend/                         # Express ESM API & Real-time WebSocket Voice/Chat Orchestrator
│   ├── db/
│   │   ├── connection.js             # Mongoose database connection
│   │   └── models/                   # Schemas (User, Agent, Call, Lead, Appointment, ChatSession, AddOn, etc.)
│   ├── middleware/                   # Security (Helmet, CORS), Auth (JWT), Rate limiters, Webhook validators
│   ├── routes/                       # REST API endpoints & Webhooks
│   │   ├── auth.js                   # Auth, OTP, Google login & token refresh
│   │   ├── agents.js / chatbots.js   # AI Agent & Chatbot management
│   │   ├── calls.js / bulkCalls.js   # Voice Call logs & bulk calling engine
│   │   ├── leads.js / appointments.js# Lead management & appointment booking
│   │   ├── webhooks.js               # Vapi, WhatsApp, Facebook & Telegram webhook handlers
│   │   └── ...                       # Users, AddOns, Widget, Reports, Analytics
│   ├── services/                     # Core Business Logic & Real-Time Orchestrators
│   │   ├── vapi.js / vapiProxy.js    # Managed Vapi voice integration
│   │   ├── orchestrator.js           # Custom voice pipeline (Deepgram STT + LLM + ElevenLabs TTS)
│   │   ├── whatsappService.js        # Meta WhatsApp Cloud API integration
│   │   ├── emailService.js           # Transactional Email (Resend / MailerSend / Nodemailer)
│   │   ├── reportGenerator.js        # PDF report generator (PDFKit)
│   │   └── ...                       # Encryption, tokens, CRM integration, Audio Recorder
│   ├── recordings/                   # Local stored call recordings (.wav)
│   ├── seed.js                       # Database seeder script
│   └── index.js                      # Server bootstrap & WebSocket server setup
│
├── Client/                          # Vite + React 19 + TypeScript Frontend SPA
│   └── src/
│       ├── components/               # Reusable UI components & Interactive Widgets
│       │   ├── PublicNavbar.tsx      # Floating glassmorphism navbar with popover dropdowns
│       │   ├── GoogleTranslate.tsx   # 130+ languages modal with search & portal overlay
│       │   ├── UnifiedAssistantWidget.tsx # Floating site-wide AI Voice + Chat widget
│       │   ├── LandingCallWidget.tsx # Interactive in-browser real-time call sandbox
│       │   └── DataTable.tsx / Sidebar.tsx / Modal.tsx / FormElements.tsx / ...
│       ├── pages/
│       │   ├── public/               # Marketing & Public pages
│       │   │   ├── sections/         # Landing components (Hero, Features, FAQ, ROI Estimator, Spectrum)
│       │   │   ├── Pricing.tsx       # Main pricing view with USD/INR & Monthly/Yearly toggles
│       │   │   ├── VoiceAssistancePricing.tsx # Dedicated AI Voice plan matrix
│       │   │   ├── AiChatbotPricing.tsx       # Dedicated AI Chatbot plan matrix
│       │   │   └── CaseStudies.tsx / Blog.tsx / News.tsx / AboutUs.tsx / ...
│       │   ├── user/                 # Multi-tenant User Dashboard pages
│       │   │   └── UserDashboard.tsx / MyAgents.tsx / MyCalls.tsx / MyLeads.tsx / MyChatbots.tsx / ...
│       │   └── admin/                # Platform Administrator Dashboard pages
│       │       └── AdminDashboard.tsx / AdminUsers.tsx / AdminAgents.tsx / AdminBilling.tsx / ...
│       ├── store/                    # Redux Toolkit store & feature slices
│       ├── services/                 # Axios HTTP clients & API wrappers
│       ├── config/                   # System constants, voices & agent configurations
│       ├── hooks/                    # Custom React hooks
│       ├── types/                    # Shared TypeScript interfaces & type definitions
│       └── utils/                    # Helper functions (plan resolution, formatting)
│
├── CLAUDE.md                        # Guidance for AI coding agents
└── README.md                       # Master platform documentation
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- A Vapi API key (for managed voice agents)

### 1. Backend

```bash
cd backend
npm install

# Create backend/.env (see Environment Variables below)
npm run dev      # start with auto-reload (nodemon)
# npm start      # production start
# npm run seed   # seed the database with test data
```

The API listens on `http://localhost:3000` by default. Health check: `GET /api/health`.

### 2. Frontend

```bash
cd Client
npm install

# Create Client/.env with VITE_API_URL
npm run dev      # dev server → http://localhost:5173
npm run build    # type-check (tsc -b) + production build
npm run preview  # preview the production build
npm run lint     # run ESLint
```

---

## Environment Variables

### Backend (`backend/.env`)

**Required**
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — signing secret for access tokens
- `JWT_REFRESH_SECRET` — signing secret for refresh tokens
- `VAPI_API_KEY` — Vapi API key for voice agents
- `FRONTEND_URL` — frontend origin (CORS)
- `WEBHOOK_URL` — public webhook endpoint for Vapi callbacks

**Optional**
- `PORT` — server port (default: `3000`)
- `NODE_ENV` — `development` | `production`
- `TRUST_PROXY` — set `true` behind a reverse proxy
- `ELEVENLABS_API_KEY` — ElevenLabs TTS
- `GROQ_API_KEY` — Groq LLM
- `OPENAI_API_KEY` — OpenAI LLM
- `ADMIN_SECRET` — admin registration secret
- `API_KEY_HASH_SALT` — salt for hashing per-user API keys
- Email/WhatsApp/Twilio/Deepgram provider keys as used by the corresponding services

> On startup in production, the server asserts that `JWT_SECRET`, `MONGODB_URI`, and `VAPI_API_KEY` are present and exits if any are missing.

### Frontend (`Client/.env`)
- `VITE_API_URL` — backend API base URL (e.g. `http://localhost:3000`)

---

## Deployment

### Backend
The backend utilizes persistent WebSockets (`ws`) for Twilio and browser media streams. Therefore, **serverless hosts like Vercel/Netlify Functions cannot run the backend**. Use a persistent node server:

#### 1. Render (Paid Starter - Recommended)
- **Service Type**: Web Service
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node index.js`
- **Uptime**: Upgrading to the **Starter** ($7/month) plan prevents the server from spinning down. On the free tier, the server goes to sleep after 15 minutes. To avoid timeouts on free tier calls, use a ping service like [Cron-job.org](https://cron-job.org) to request `https://your-app.onrender.com/api/health` every 10 minutes (note: keeping it awake 24/7 may exceed the 750 free hours monthly limit).

#### 2. Railway
- **Root Directory**: `backend`
- **Settings**: Railway does not put servers to sleep. Highly recommended for development, as it stays online 24/7.

#### 3. Fly.io
- Fly.io deploys micro-VMs close to edge users, minimizing latency for the voice engine. Run `fly launch` in `/backend` to deploy.

### Frontend
The frontend is a React SPA and can be deployed to **Vercel** or **Netlify**:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Routing**: SPA routing fallback is pre-configured via [vercel.json](file:///e:/Saas/Client/vercel.json).

---

## Backend

Express app (ESM) bootstrapped in `backend/index.js`. Request flow:

1. Request ID injection
2. Security headers (Helmet)
3. CORS (with pre-flight)
4. Body parsing — JSON (`256kb`), raw text for the Vapi webhook, urlencoded (`32kb`)
5. Cookie parsing + gzip compression
6. Mongo sanitization + HPP (HTTP parameter pollution) guard
7. Global rate limiting
8. Short-lived cache headers for GET `/api/*`
9. Request logging
10. Route handlers
11. `notFoundHandler` → `errorHandler`

After `app.listen`, the **custom voice orchestrator** is attached to the HTTP server, exposing WebSocket endpoints `/media-stream` and `/web-call`. Graceful shutdown closes the server and Mongoose connection on `SIGTERM` / `SIGINT`.

### Data Models

Mongoose schemas in `backend/db/models/`:

| Model | Purpose | Key fields |
| --- | --- | --- |
| **User** | Multi-tenant account | `email`, `password` (hashed, hidden), `role` (`admin`/`user`), `plan`, `chatPlan`, `voicePlan`, usage counters (`callsUsed/Limit`, `minutesUsed/Limit`, `chatUsed/Limit`), `isActive`, `isVerified`, OTP + lockout fields, hashed `apiKey` |
| **Agent** | Voice/chat agent | `userId`, `vapiId`, `name`, `type` (`receptionist`/`appointment`/`faq`), `prompt`, `voiceId`, `phoneNumber(Id)`, `language`, `useCustomEngine`, `customEngineModel`, Twilio creds, `callCount` |
| **Call** | Call record | `agentId`, `userId`, `vapiCallId`, `callerNumber`, `duration`, `status` (`completed`/`missed`/`failed`/`in-progress`), `recordingUrl`, `transcript`, `startedAt`/`endedAt`, `billed` |
| **Lead** | Captured lead | `agentId`, `callId`, `userId`, `name`, `phone`, `email`, `purpose`, `notes`, `status`, `leadType` (`call`/`public`/`chat`) |
| **Appointment** | Booked appointment | `agentId`, `callId`, `userId`, contact info, `service`, `provider`, `preferredDate/Time`, `status` |
| **ChatSession** | Chatbot conversation | `userId`, `title`, embedded `messages[]` (`role`: `user`/`bot`, `text`, `timestamp`) |
| **AddOn** | Purchasable add-on catalog entry | `id`, `title`, `price`, `category` (`recurring`/`one-time`), `type` (`chat`/`voice`), `active` |
| **UserAddOn** | A user's purchased add-on | links user ↔ add-on |
| **UpgradeRequest** | Plan upgrade request | user + requested plan |
| **Contact** | Contact-form submission | `name`, `email`, `phone`, `company`, `message`, `status` |
| **RefreshToken** | Persisted refresh tokens | token rotation / revocation |
| **Webhook** | Raw inbound webhook log | `type`, `payload`, `processed` |

### API Routes

All mounted under `/api` in `backend/index.js`:

| Mount | File | Description |
| --- | --- | --- |
| `/api/auth` | `routes/auth.js` | Register, login, OTP verify, Google login, refresh, logout, me |
| `/api/users` | `routes/users.js` | User CRUD, block/unblock (admin) |
| `/api/agents` | `routes/agents.js` | Agent CRUD, phone assignment, testing |
| `/api/agents/public/demo` | `routes/publicDemo.js` | Public demo agent (unauthenticated) |
| `/api/calls` | `routes/calls.js` | Call history & details |
| `/api/leads` | `routes/leads.js` | Leads listing + CSV export |
| `/api/leads/public` | `routes/publicLead.js` | Public lead capture |
| `/api/appointments` | `routes/appointments.js` | Appointment management |
| `/api/analytics` | `routes/analytics.js` | Dashboard stats & usage |
| `/api/upgrade-requests` | `routes/upgradeRequests.js` | Plan upgrade requests |
| `/api/add-ons` | `routes/addOns.js` | Add-on catalog & purchases |
| `/api/chat` | `routes/chat.js` | Chatbot messaging |
| `/api/agent-chat` | `routes/agentChat.js` | Agent-scoped chat |
| `/api/user-chat` | `routes/userChat.js` | User assistant chat |
| `/api/chat-history` | `routes/chatHistory.js` | Chat session history |
| `/api/contact` | `routes/contact.js` | Contact-form submissions |
| `/api/reports` | `routes/reports.js` | PDF/report generation |
| `/api/widget` | `routes/widget.js` | Embeddable chat widget backend |
| `/api/tts` | `routes/tts.js` | Text-to-speech |
| `/api/webhooks` | `routes/webhooks.js` | Vapi webhook receiver (`call.started`, `call.ended`, `end-of-call-report`) |
| `/api/vapi` | `services/vapiProxy.js` | Authenticated proxy to the Vapi API |
| `/api/recordings` | static | Serves stored `.wav` recordings |
| `/api/health` | inline | Health check (status + DB state) |

### Services

Business logic in `backend/services/`:

- **`vapi.js` / `vapiProxy.js`** — Vapi API wrapper and authenticated proxy.
- **`orchestrator.js` / `orchestratorHandlers.js` / `orchestratorShared.js`** — custom real-time voice engine (see below).
- **`tts.js` / `translate.js`** — text-to-speech and translation/language helpers.
- **`audioRecorder.js`** — captures and writes call audio to `recordings/`.
- **`mediaStreamToken.js`** — signed tokens for media-stream / web-call auth.
- **`appointmentTools.js`** — LLM tool-calling for appointment booking.
- **`emailService.js`** — transactional email (Resend / MailerSend / Nodemailer).
- **`whatsappService.js`** — WhatsApp message delivery.
- **`reportGenerator.js`** — PDF reports via PDFKit.
- **`tokenService.js` / `cookieService.js`** — JWT access/refresh issuance and cookie handling.
- **`crypto.js` / `encryption.js`** — request IDs, hashing, field encryption.
- **`planResolver.js`** — resolves effective chat/voice plan pairs.
- **`contentModeration.js`** — input moderation.
- **`pagination.js` / `validators.js` / `logger.js`** — shared utilities and structured logging.

### Middleware & Security

`backend/middleware/`:

- **`security.js`** — Helmet headers, CORS builder, Mongo sanitizer, HPP guard.
- **`rateLimiters.js`** — global + per-route rate limiting.
- **`auth.js`** — JWT validation, `requireAuth` / `requireAdmin`.
- **`accountLockout.js`** — brute-force lockout on repeated failed logins.
- **`validators.js`** — request payload validation.
- **`webhookSignature.js` / `twilioSignature.js`** — verify inbound webhook signatures.
- **`requestLogger.js`** — per-request structured logs.
- **`errorHandler.js`** — centralized error + 404 handling.

Security highlights: JWT in httpOnly cookies, bcrypt password hashing, per-user hashed API keys, OTP verification, account lockout, multi-tenant data isolation, NoSQL-injection sanitization, and signed webhook verification.

### Custom Voice Orchestrator

In addition to managed Vapi agents, Autoniv includes an **in-house real-time voice pipeline** (`services/orchestrator.js`) attached over WebSockets:

- **Endpoints:** `/media-stream` (telephony via Twilio) and `/web-call` (browser).
- **Pipeline:** Deepgram STT → LLM (OpenAI/Groq, model configurable per agent via `customEngineModel`) → tool execution (e.g. `saveLead`, appointment booking) → TTS (ElevenLabs) with optional translation.
- **Recording:** streamed audio captured by `audioRecorder.js`.
- Agents opt into this engine with `useCustomEngine: true`.

---

## Frontend

React 19 + TypeScript SPA built with Vite. Entry: `Client/src/main.tsx` → `App.tsx`. Routes are code-split with `React.lazy` + `Suspense`, wrapped in an `ErrorBoundary`.

### Routing

Access control is enforced by `<ProtectedRoute>` in `App.tsx`:

- `adminOnly` — restricts to `admin` role.
- `feature="voice" | "chat"` — gates routes by the user's resolved plan (`isVoicePlan` / `isChatPlan` in `utils/plan.ts`).
- Unauthenticated users are redirected to `/`; role-based redirects send admins to `/admin` and users to `/dashboard`.

### Pages

**Public** (`pages/public/`) — Landing (composed of `sections/`: Hero, Features, Pricing, Testimonials, FAQ, Industry, Comparison, CTA…), Login, Register, ForgotPassword, Pricing (Main pricing overview with USD/INR & Monthly/Yearly toggles + ROI Estimator), `VoiceAssistancePricing` (Dedicated AI Voice Agent plans), `AiChatbotPricing` (Dedicated AI Chatbot plans), Agents/Services, Case Studies (+ detail), Blog, News, Press, Careers, About, Help Center, Privacy, Terms, 404.

**User dashboard** (`pages/user/`) — UserDashboard, MyAgents, CreateAgent, CreateCustomAgent, CustomWebCall, MyCalls, MyLeads, MyAppointments, MyChat, UserBilling, MyAddOns.

**Admin dashboard** (`pages/admin/`) — AdminDashboard, AdminUsers, CreateUser, AdminAgents, AdminCalls, AdminLeads, AdminAppointments, AdminChat, AdminBilling, AdminUpgradeRequests, AdminAddOns.

### Components

Reusable UI in `components/`: `PublicNavbar` (Floating responsive glassmorphism navbar with multi-level popover dropdowns), `GoogleTranslate` (130+ languages translation selector with search & portal overlay), `Sidebar`, `Breadcrumbs`, `StatCard`, `DataTable`, `Pagination`, `Modal`, `ConfirmDialog`, `Dropdown`, `Badge`, `FormElements`, `SearchInput`, `Toast`/`ToastContainer`, `Tooltip`, `LoadingScreen`, `ErrorBoundary`, `EmptyStateGuide`, `OnboardingTour`, `WelcomeOnboarding`, chart blocks (`AreaChartBlock`, `PieChartBlock`), and voice/chat widgets (`ChatBotWidget`, `UnifiedAssistantWidget`, `LandingCallWidget`, `VoicePreviewButton`, `AgentPanel`, `AIAssistantChat`).

### State Management

Redux Toolkit store (`store/index.ts`) with slices in `store/slices/`:

`auth`, `agents`, `calls`, `leads`, `users`, `analytics`, `upgradeRequests`, `appointments`, `addOns`.

API access via axios clients in `services/` (`api.ts`, `orchestratorApi.ts`, `cookies.ts`). Session storage caches user and dashboard stats for persistence across reloads.

---

## Website Content & Feature Breakdown

Autoniv provides a comprehensive enterprise marketing site and SaaS portal experience designed to showcase multi-channel AI voice and chatbot automation capabilities.

### 1. Header & Navigation (`PublicNavbar`)
- **Glassmorphism Floating Bar**: Fixed top pill navigation container with dynamic scroll styling, backdrop blur (`blur-md`), and high contrast branding.
- **Nested Popover Dropdowns**: Interactive hover dropdown menu under **Pricing** providing direct access to specialized plan views:
  - 🎙️ **AI Voice Assistance** (`/pricing/voice-assistance`)
  - 💬 **AI Chatbots** (`/pricing/ai-chatbot`)
- **Global Localization (`GoogleTranslate`)**: Integrated language switcher featuring:
  - 130+ world languages modal with instant live filter search.
  - Automatic browser locale detection with cookie fallback (`googtrans`).
  - Rendered via React Portals directly onto `document.body` to avoid overflow clipping issues.
- **Mobile Drawer**: Slide-in mobile menu drawer with smooth animations and keyboard accessibility (`Escape` key support).

### 2. Public Marketing & Product Pages
- **Landing Page (`/`)**:
  - **Hero Section**: Animated gradient typography, drifting ambient lighting, trust badges, and primary trial CTAs.
  - **USP Slider & Value Props**: Highlights setup speed, DPDP Act 2023 compliance, 20+ accent variations, and live uptime guarantees.
  - **Interactive Demos**:
    - `LandingCallWidget` — Live in-browser WebRTC call sandbox to test AI voice responses in real time.
    - `Spectrum` & `PhoneMockup` — Visual simulation of active inbound/outbound calls and real-time speech synthesis.
  - **Interactive ROI Estimator**: Range slider computing monthly call volume savings between traditional human call centers and Autoniv AI voice agents.
  - **Comparison Matrix**: Detailed feature comparison contrasting human agent overhead against Autoniv AI agents.
  - **Customer Proof & Testimonials**: Enterprise brand showcases and verified customer ratings (4.9/5 stars).
  - **Interactive FAQ Accordion**: Expandable answers addressing setup times, pricing, integrations, and telephony numbers.

- **Services & AI Solutions (`/services`)**:
  - Full product catalog featuring Receptionist, Appointment Booking, Lead Capture, and Customer Support agent presets.

- **Feature-Specific Deep Dives**:
  - `/ai-voice-agent` — Inbound/outbound telephony agents, latency metrics, and custom prompt configuration.
  - `/ai-chatbot` — Multi-channel messaging automation across Web, WhatsApp, Instagram, Messenger, and Telegram.
  - `/ai-phone-answering` — 24/7 AI virtual receptionist, concurrent call scaling, spam filtering, and human handoff.
  - `/appointment-booking` — Autonomous calendar scheduling, real-time availability checks, and SMS/WhatsApp booking reminders.
  - `/customer-support` — Automated Tier-1 inquiry resolution reducing support operating costs by up to 70%.

- **Vertical Industry Solutions**:
  - `/industries/real-estate` — Tailored lead qualification, property tour scheduling, and buyer follow-up.
  - `/industries/healthcare` — HIPAA/DPDP-compliant patient intake, prescription refills, and appointment scheduling.

### 3. Transparent Pricing Experience
- **Unified Pricing Overview (`/pricing`)**:
  - **Billing Cycle Toggle**: Instant toggle between **Monthly** and **Yearly** billing with 20% annual savings highlighted.
  - **Currency Toggle**: Real-time price conversion between **$ USD** and **₹ INR**.
  - **Interactive ROI Estimator**: Embedded savings calculator letting prospective buyers estimate monthly ROI.
- **Dedicated Voice Pricing (`/pricing/voice-assistance`)**:
  - Tiers: Launch, Growth, Scale, and Enterprise plans with minute allocations, extra minute rates, setup fees, and phone number options.
- **Dedicated Chat Pricing (`/pricing/ai-chatbot`)**:
  - Tiers: Free, Starter, Growth, and Enterprise plans detailing channel access, chatbot limits, and conversation quotas.

### 4. Case Studies & Corporate Info
- **Case Studies (`/case-studies` & `/case-studies/:id`)**:
  - Real customer outcomes (e.g. 70% cost reduction, 3x lead growth) filterable by industry with detailed implementation breakdowns.
- **Company & News (`/about`, `/careers`, `/press`, `/news`, `/blog`)**:
  - Corporate background, open career listings, media press kit, latest news, and technical blog posts.
- **Support & Legal (`/help`, `/privacy`, `/terms`)**:
  - Searchable Help Center documentation, comprehensive Privacy Policy, and Terms & Conditions.

### 5. Floating Interactive Widgets
- **`UnifiedAssistantWidget`**: Site-wide persistent chat and voice widget enabling website visitors to interact directly with an AI assistant from any public page.

---

## Plan System

Plans are defined in `backend/db/models/User.js` as `PLAN_CONFIG`. A user has a resolved **chat plan** and **voice plan** pair (legacy single-`plan` values are migrated automatically in a `pre('save')` hook).

**Families & tiers**

| Family | Plans |
| --- | --- |
| Chat | `chat_free`, `chat_starter`, `chat_growth`, `chat_enterprise` |
| Voice | `voice_free`, `voice_starter`, `voice_growth`, `voice_enterprise` |
| Both | `both_free`, `both_starter`, `both_growth`, `both_enterprise` |
| Legacy | `free`, `starter`, `growth`, `enterprise` (treated as “both”) |

Each plan defines:

- **`limits`** — `{ calls, minutes, chatbots, conversations }` (`-1` = unlimited)
- **`features`** — boolean flags, e.g. `whatsapp`, `removeBranding`, `allChannels`, `crmIntegration`, `analytics`, `customAI`, `dpdpCompliance`, `dedicatedManager` (chat) and `leadCapture`, `customScripts`, `prioritySupport`, `customReporting`, `whiteLabel`, `advancedAutomation` (voice)
- **Pricing** — `monthlyPrice` (INR), `monthlyPriceUSD`, `setupFee`

Helper methods on the User model: `getResolvedPlans()`, `getPlanConfig()`, `hasFeature()`, `canAddChatbot()`, `hasExceededConversations()`, `hasExceededCalls()`, `hasExceededMinutes()`. On the frontend, use `isChatPlan()` / `isVoicePlan()` from `Client/src/utils/plan.ts`.

---

## Vapi Integration

- **Wrapper:** `backend/services/vapi.js` — create/update assistants, phone numbers, calls.
- **Proxy:** `backend/services/vapiProxy.js` mounted at `/api/vapi/*` for authenticated client-side calls.
- **Webhooks:** `backend/routes/webhooks.js` at `/api/webhooks/vapi` handles `call.started`, `call.ended`, and `end-of-call-report`, persisting call records, transcripts, recordings, and usage.
- The raw webhook body is parsed as text (for signature verification) before JSON parsing.

**Agent types**

- **Receptionist** — greets callers, collects name/phone/purpose, saves a lead.
- **Appointment** — collects service + preferred date/time and books an appointment.
- **FAQ** — answers common questions from a knowledge base and escalates when needed.

---

## Design System

| Token | Value |
| --- | --- |
| Primary | `#6366f1` (Indigo) |
| Secondary | `#8b5cf6` (Violet) |
| Accent | `#22c55e` (Green — success/online) |
| Warning | `#f59e0b` (Amber) |
| Danger | `#ef4444` (Red) |
| Background | `#0f172a` (Slate 900) |
| Surface | `#1e293b` (Slate 800) |
| Text primary | `#f8fafc` (Slate 50) |
| Text secondary | `#94a3b8` (Slate 400) |

- **Typography:** Inter (headings/body), JetBrains Mono (IDs, timestamps).
- **Spacing:** 4px base unit; 24px card padding; 8px card radius, 6px buttons, 4px inputs.
- **Motion:** 200ms ease-out transitions, subtle card hover lift, 300ms page fade-in, skeleton loading states.

Use TailwindCSS utilities matching these tokens (e.g. `bg-indigo-600`, `text-violet-500`).

---

## Common Tasks

**Add an API endpoint** — create `backend/routes/<resource>.js`, add auth middleware (`requireAuth`/`requireAdmin`), mount in `index.js`, add a client method in `Client/src/services/api.ts`.

**Add a page** — create `Client/src/pages/<role>/<Page>.tsx`, export from the folder `index.ts`, add a lazy import + `<Route>` (wrapped in `<ProtectedRoute>`) in `App.tsx`.

**Change plan limits/features** — edit `PLAN_CONFIG` in `backend/db/models/User.js`; changes apply immediately to validation logic.

**Seed test data** — `npm run seed` in `backend/`.