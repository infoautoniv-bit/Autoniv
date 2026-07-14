# Autoniv — Backend

REST + WebSocket API for the Autoniv AI voice-agent & chatbot SaaS platform. It handles authentication, agent management, call/lead/appointment data, billing add-ons, chat, analytics, and a real-time voice **orchestrator** that bridges telephony audio to STT → LLM → TTS providers.

Built with **Node.js (ESM)**, **Express 4**, **MongoDB/Mongoose**, and **WebSockets**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [API Overview](#api-overview)
- [Security](#security)
- [Voice Orchestrator](#voice-orchestrator)

---

## Tech Stack

| Concern          | Choice                                             |
| ---------------- | -------------------------------------------------- |
| Runtime          | Node.js (ESM, `"type": "module"`)                  |
| Web framework    | Express 4                                          |
| Database         | MongoDB via Mongoose 8                             |
| Auth             | JWT access/refresh tokens, bcryptjs, cookies       |
| Real-time        | `ws` WebSocket server (voice orchestrator)         |
| Voice / AI       | Vapi, OpenAI, Groq, Gemini, Deepgram, ElevenLabs, Azure Speech, Sarvam |
| Email            | Resend, MailerSend, Nodemailer                     |
| Media            | Cloudinary (recordings), PDFKit (reports)          |
| Messaging        | Twilio, WhatsApp Business API                      |
| Security         | Helmet, CORS, rate limiting, HPP, mongo-sanitize   |

---

## Project Structure

```
backend/
├── index.js                 # App entry — middleware, route mounts, server bootstrap
├── seed.js                  # Seed script for initial data
├── get_tunnel.js            # Dev helper for exposing a public tunnel URL
├── db/
│   ├── connection.js        # Mongoose connection
│   └── models/              # Mongoose schemas (User, Agent, Call, Lead, …)
├── routes/                  # Express routers, one per resource
├── services/                # Business logic + integrations (orchestrator, vapi, tts, email, …)
├── middleware/              # auth, security, rate limiters, error handling, signatures
├── scripts/                 # One-off maintenance/migration scripts
└── recordings/              # Locally stored call recordings (served statically)
```

### Key models (`db/models/`)

`User`, `Agent`, `Call`, `Lead`, `Appointment`, `ChatSession`, `Contact`, `AddOn`, `UserAddOn`, `UpgradeRequest`, `Webhook`, `RefreshToken`.

---

## Prerequisites

- **Node.js** 18+ (ESM support)
- **MongoDB** instance (local or Atlas)
- API keys for the providers you intend to use (see [Environment Variables](#environment-variables))

---

## Getting Started

```bash
cd backend
npm install

# Create your .env (see below), then:
npm run dev        # start with nodemon (auto-reload)
# or
npm start          # start with node
```

The server listens on `PORT` (default **3000**) and mounts all routes under `/api`.

Optionally seed initial data:

```bash
npm run seed
```

---

## Environment Variables

Create a `.env` file in `backend/`. Provider keys are only required for the features you enable. In **production**, the server refuses to start unless `JWT_SECRET`, `MONGODB_URI`, and `VAPI_API_KEY` are set.

### Core

| Variable         | Required | Description                                  |
| ---------------- | -------- | -------------------------------------------- |
| `PORT`           | no       | HTTP port (default `3000`)                   |
| `NODE_ENV`       | no       | `development` / `production`                 |
| `MONGODB_URI`    | **yes**  | MongoDB connection string                    |
| `FRONTEND_URL`   | yes      | Allowed CORS origin (client app URL)         |
| `ADMIN_FRONTEND_URL` | no   | Additional allowed origin for admin app      |
| `SERVER_URL`     | no       | Public base URL of this server               |
| `TRUST_PROXY`    | no       | `true` to trust the reverse proxy            |

### Auth & Security

| Variable            | Required | Description                              |
| ------------------- | -------- | ---------------------------------------- |
| `JWT_SECRET`        | **yes**  | Signing secret for access tokens         |
| `JWT_REFRESH_SECRET`| yes      | Signing secret for refresh tokens        |
| `JWT_ACCESS_TTL`    | no       | Access-token lifetime                    |
| `JWT_REFRESH_TTL`   | no       | Refresh-token lifetime                   |
| `COOKIE_DOMAIN`     | no       | Cookie domain for auth cookies           |
| `ENCRYPTION_KEY`    | yes      | Key for encrypting sensitive fields      |
| `API_KEY_HASH_SALT` | no       | Salt for hashing stored API keys         |
| `ADMIN_SECRET`      | no       | Secret guarding privileged admin actions |
| `MEDIA_STREAM_SECRET` | no     | Signs media-stream tokens                |

### Voice / AI Providers

| Variable                | Description                              |
| ----------------------- | ---------------------------------------- |
| `VAPI_API_KEY`          | Vapi API key (**required** in prod)      |
| `VAPI_BASE_URL`         | Vapi API base URL                        |
| `VAPI_WEBHOOK_SECRET`   | Verifies inbound Vapi webhooks           |
| `WEBHOOK_URL`           | Public webhook URL registered with Vapi  |
| `OPENAI_API_KEY`        | OpenAI (LLM)                             |
| `GROQ_API_KEY`          | Groq (LLM)                               |
| `GEMINI_API_KEY`        | Google Gemini (LLM)                      |
| `DEEPGRAM_API_KEY`      | Deepgram (STT)                           |
| `ELEVENLABS_API_KEY`    | ElevenLabs (TTS)                         |
| `AZURE_SPEECH_KEY`      | Azure Speech (STT/TTS, optional)         |
| `AZURE_SPEECH_REGION`   | Azure Speech region                      |
| `SARVAM_API_KEY`        | Sarvam (Indian-language voice, optional) |

> A starter template for orchestrator providers lives in `.env.orchestrator.example`.

### Integrations

| Variable                                                 | Description                     |
| -------------------------------------------------------- | ------------------------------- |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Recording storage |
| `RESEND_API_KEY`, `RESEND_FROM`                          | Transactional email (Resend)    |
| `MAILERSEND_FROM_NAME`                                   | MailerSend sender name          |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Telephony / SMS           |
| `WHATSAPP_API_URL`, `WHATSAPP_API_KEY`, `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business    |
| `GOOGLE_CLIENT_ID`                                       | Google OAuth login              |

### Appointments

| Variable             | Description                                |
| -------------------- | ------------------------------------------ |
| `APPT_OPEN_HOUR`     | Booking window start hour                  |
| `APPT_CLOSE_HOUR`    | Booking window end hour                    |
| `APPT_SLOT_MINUTES`  | Slot length in minutes                     |
| `BUSINESS_NAME`      | Business name used in booking messages     |

> **Never commit `.env`.** Rotate any key that is accidentally exposed.

---

## Scripts

| Command         | Description                            |
| --------------- | -------------------------------------- |
| `npm start`     | Start the server with `node`           |
| `npm run dev`   | Start with `nodemon` (auto-reload)     |
| `npm run seed`  | Seed initial data into MongoDB         |

---

## API Overview

All routes are mounted under `/api`:

| Path                        | Purpose                                        |
| --------------------------- | ---------------------------------------------- |
| `/api/auth`                 | Register, login, OTP, refresh, Google OAuth     |
| `/api/users`                | User management                                |
| `/api/agents`               | Voice/chat agent CRUD                          |
| `/api/agents/public/demo`   | Public demo agent (unauthenticated)            |
| `/api/calls`                | Call records, transcripts, recordings          |
| `/api/leads` `/api/leads/public` | Lead capture & management                 |
| `/api/appointments`         | Appointment booking                            |
| `/api/webhooks`             | Inbound provider webhooks (e.g. Vapi)          |
| `/api/analytics`            | Usage & performance metrics                    |
| `/api/upgrade-requests`     | Plan upgrade requests                          |
| `/api/add-ons` `/api/reports` | Billing add-ons, PDF reports                 |
| `/api/chat` `/api/agent-chat` `/api/user-chat` `/api/chat-history` | Chat features |
| `/api/contact`              | Contact form submissions                       |
| `/api/widget`               | Embeddable chat widget endpoints               |
| `/api/tts`                  | Text-to-speech                                 |
| `/api/vapi`                 | Vapi proxy                                      |
| `/api/recordings`           | Static recording files                         |

---

## Security

Applied globally in `index.js` / `middleware/`:

- **Helmet** security headers + configurable CSP
- **CORS** locked to `FRONTEND_URL` / `ADMIN_FRONTEND_URL`
- **Rate limiting** (global + per-route limiters) and **account lockout**
- **HPP** (HTTP parameter pollution) guard and **mongo-sanitize**
- **Webhook signature verification** (Vapi, Twilio)
- Raw-body capture on `/api/webhooks/vapi` for signature validation
- JWT auth with refresh-token rotation; secrets asserted at startup in prod

---

## Voice Orchestrator

`services/orchestrator.js` (with `orchestratorHandlers.js` and `orchestratorShared.js`) runs a WebSocket-based real-time pipeline: it receives streamed call audio, routes it through **STT → LLM → TTS** providers, and streams synthesized audio back. It is initialized during server bootstrap (`initOrchestrator`), and provider selection is driven by the AI-provider environment variables above.
