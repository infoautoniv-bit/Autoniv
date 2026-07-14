# Autoniv — Client

Frontend for the Autoniv AI voice-agent & chatbot SaaS platform. It provides the public marketing site, authentication, and role-based dashboards (**user**, **admin**) for managing agents, calls, leads, appointments, billing, and chat.

Built with **React 19**, **TypeScript**, **Vite**, **Redux Toolkit**, **Tailwind CSS 4**, and **Framer Motion**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Architecture Notes](#architecture-notes)

---

## Tech Stack

| Concern           | Choice                              |
| ----------------- | ----------------------------------- |
| Framework         | React 19                            |
| Language          | TypeScript                          |
| Build tool        | Vite 8                              |
| State             | Redux Toolkit + React Redux         |
| Routing           | React Router 7                      |
| Styling           | Tailwind CSS 4 (`@tailwindcss/vite`)|
| Animation         | Framer Motion                       |
| UI primitives     | Headless UI, Heroicons              |
| Data fetching     | Axios (with token refresh)          |
| Charts            | Recharts                            |
| Voice             | `@vapi-ai/web`                      |
| Notifications     | react-hot-toast                     |

---

## Project Structure

```
Client/
├── index.html
├── vite.config.ts
├── src/
│   ├── main.tsx              # App bootstrap
│   ├── App.tsx               # Routes, auth guard, lazy-loaded pages
│   ├── index.css             # Global styles + keyframes
│   ├── components/           # Reusable UI (Sidebar, DataTable, widgets, charts, …)
│   ├── pages/
│   │   ├── public/           # Landing, auth, marketing pages
│   │   │   └── sections/     # Landing-page sections (Hero, Demo, Services, …)
│   │   ├── user/             # User dashboard (agents, calls, leads, billing, chat)
│   │   └── admin/            # Admin dashboard (users, agents, billing, …)
│   ├── store/                # Redux store
│   │   └── slices/           # auth, agents, calls, leads, analytics, add-ons, …
│   ├── services/             # api.ts (axios), orchestratorApi.ts, cookies.ts
│   ├── config/               # constants, agent config, voice presets
│   ├── hooks/                # Custom hooks (useStore, …)
│   ├── data/                 # Static data
│   ├── types/                # Shared TypeScript types
│   ├── utils/                # Helpers (plan checks, formatting, …)
│   └── assets/               # Images and static assets
```

---

## Prerequisites

- **Node.js** 18+
- The [backend](../backend/README.md) running and reachable (default `http://localhost:3000/api`)

---

## Getting Started

```bash
cd Client
npm install

# Create your .env (see below), then:
npm run dev
```

Vite serves the app on **http://localhost:5173** by default.

---

## Environment Variables

Create a `.env` file in `Client/`. All client-exposed variables **must** be prefixed with `VITE_`.

> ⚠️ Anything prefixed `VITE_` is bundled into the client and publicly visible. Only put non-secret, public values here (publishable keys, public URLs) — never private API secrets.

| Variable                 | Required | Description                                        |
| ------------------------ | -------- | -------------------------------------------------- |
| `VITE_API_URL`           | yes      | Backend API base URL (default `http://localhost:3000/api`) |
| `VITE_GOOGLE_CLIENT_ID`  | no       | Google OAuth client ID for login                   |
| `VITE_VAPI_API_KEY`      | no       | Vapi public/web key for in-browser voice calls     |
| `VITE_CONTACT_EMAIL`     | no       | Contact email shown on the site                    |
| `VITE_CONTACT_PHONE`     | no       | Contact phone (display)                            |
| `VITE_CONTACT_PHONE_RAW` | no       | Contact phone (tel: link)                          |
| `VITE_CONTACT_WEBSITE`   | no       | Public website URL                                 |

---

## Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start the Vite dev server                |
| `npm run build`   | Type-check (`tsc -b`) and build for prod |
| `npm run preview` | Preview the production build locally     |
| `npm run lint`    | Run ESLint                               |

---

## Architecture Notes

- **Routing & auth** — `App.tsx` defines all routes, lazy-loads pages with `React.lazy` + `Suspense`, and guards protected routes based on auth state and the user's plan (`isVoicePlan` / `isChatPlan`).
- **State** — Redux Toolkit slices in `store/slices` hold auth, agents, calls, leads, analytics, appointments, add-ons, and users. Access them via the typed `useStore` hooks.
- **API layer** — `services/api.ts` is a preconfigured Axios instance with `withCredentials`, a 30s timeout, and **proactive JWT refresh** (it schedules a refresh shortly before token expiry to avoid 401 delays).
- **Plans** — the app distinguishes **voice** and **chat** plans; UI and available features adapt accordingly (see `utils/plan`).
- **Performance** — animation-heavy landing sections use memoization, compositor-friendly CSS transforms, `content-visibility`, and reduced element counts to keep scrolling and hover interactions smooth.
