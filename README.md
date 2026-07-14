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
| **Messaging** | WhatsApp, Twilio (media streams), Resend / MailerSend / Nodemailer (email) |
| **Docs / Reports** | PDFKit (PDF report generation) |

---

## Repository Layout

```
Saas/
├── backend/                 # Node.js / Express API + WebSocket orchestrator
│   ├── db/
│   │   ├── connection.js     # Mongoose connection
│   │   └── models/           # Mongoose schemas
│   ├── routes/               # Express route handlers (REST API)
│   ├── middleware/           # Auth, security, rate limiting, validators
│   ├── services/             # Business logic (vapi, tts, orchestrator, email…)
│   ├── scripts/              # Utility / maintenance scripts
│   ├── recordings/           # Stored call recordings (.wav)
│   ├── seed.js               # Database seeding
│   └── index.js              # App entry point
│
├── Client/                  # React + TypeScript SPA (Vite)
│   └── src/
│       ├── pages/
│       │   ├── public/       # Landing, auth, marketing pages
│       │   ├── admin/        # Admin dashboard pages
│       │   └── user/         # User dashboard pages
│       ├── components/       # Reusable UI components
│       ├── store/            # Redux Toolkit slices
│       ├── services/         # API clients (axios)
│       ├── hooks/            # Custom React hooks
│       ├── config/           # Static config (voices, agents, constants)
│       ├── data/             # Static catalogs (add-ons)
│       ├── types/            # Shared TypeScript types
│       └── utils/            # Helpers (plan resolution, etc.)
│
├── CLAUDE.md                # Guidance for AI coding agents
└── README.md               # This file
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

**Public** (`pages/public/`) — Landing (composed of `sections/`: Hero, Features, Pricing, Testimonials, FAQ, Industry, Comparison, CTA…), Login, Register, ForgotPassword, Pricing, Agents/Services, Case Studies (+ detail), Blog, News, Press, Careers, About, Help Center, Privacy, Terms, 404.

**User dashboard** (`pages/user/`) — UserDashboard, MyAgents, CreateAgent, CreateCustomAgent, CustomWebCall, MyCalls, MyLeads, MyAppointments, MyChat, UserBilling, MyAddOns.

**Admin dashboard** (`pages/admin/`) — AdminDashboard, AdminUsers, CreateUser, AdminAgents, AdminCalls, AdminLeads, AdminAppointments, AdminChat, AdminBilling, AdminUpgradeRequests, AdminAddOns.

### Components

Reusable UI in `components/`: `Sidebar`, `Breadcrumbs`, `StatCard`, `DataTable`, `Pagination`, `Modal`, `ConfirmDialog`, `Dropdown`, `Badge`, `FormElements`, `SearchInput`, `Toast`/`ToastContainer`, `Tooltip`, `LoadingScreen`, `ErrorBoundary`, `EmptyStateGuide`, `OnboardingTour`, `WelcomeOnboarding`, chart blocks (`AreaChartBlock`, `PieChartBlock`), and voice/chat widgets (`ChatBotWidget`, `UnifiedAssistantWidget`, `LandingCallWidget`, `VoicePreviewButton`, `AgentPanel`, `AIAssistantChat`).

### State Management

Redux Toolkit store (`store/index.ts`) with slices in `store/slices/`:

`auth`, `agents`, `calls`, `leads`, `users`, `analytics`, `upgradeRequests`, `appointments`, `addOns`.

API access via axios clients in `services/` (`api.ts`, `orchestratorApi.ts`, `cookies.ts`). Session storage caches user and dashboard stats for persistence across reloads.

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
#   A u t o n i v  
 #   A u t o n i v  
 