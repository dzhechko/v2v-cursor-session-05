---
# .windsurfrules

## Project Overview
- **Type:** B2B SaaS sales training simulator
- **Description:** A B2B SaaS application that enables users to practice sales conversations with an AI agent and receive feedback.
- **Primary Goal:** Allow users to practice sales conversations with an AI agent and receive detailed performance feedback.

## Project Structure
### Framework-Specific Routing
- **Directory Rules:**
  - `Next.js 14 (App Router)`: Enforce `app/` directory with nested route folders, each containing `page.tsx`, `layout.tsx`, optional `loading.tsx`, `error.tsx`.
  - Example 1: "Next.js 14 (App Router)" → `app/[route]/page.tsx` conventions
  - Example 2: "Next.js (Pages Router)" → `pages/[route].tsx` pattern
  - Example 3: "React Router 6" → `src/routes/` with `createBrowserRouter`

### Core Directories
- **Versioned Structure:**
  - `app/api` → Next.js 14 API routes with Route Handlers
  - `app/(dashboard)` → All authenticated dashboard pages (grouping folder)
  - `app/auth` → Authentication pages and server actions
  - `app/(marketing)` → Public landing pages
  - `components` → Shared UI components using Next.js 14 Server and Client Components
  - `lib` → Utility functions and API wrappers (Supabase, Stripe, Elevenlabs, OpenAI)
  - `styles` → Global and component-level CSS (e.g., Tailwind CSS config)

### Key Files
- **Stack-Versioned Patterns:**
  - `app/layout.tsx` → Next.js 14 root layout, imports global styles, defines metadata
  - `app/dashboard/layout.tsx` → Dashboard root layout with navigation and protected wrappers
  - `app/auth/login/page.tsx` → Auth flow login page using server actions for Supabase
  - `app/api/conversation/route.ts` → Next.js 14 Route Handler for voice-to-voice sessions
  - `app/api/analysis/route.ts` → Next.js 14 Route Handler for conversation analysis

## Tech Stack Rules
- **Version Enforcement:**
  - `next@14`: App Router required, no use of `getInitialProps` or `pages/` directory
  - `react@18`: Use Concurrent Features and Server Components by default
  - `TypeScript@5`: All code in TS with strict mode
  - `@vercel/node@2`: Serverless functions runtime

## PRD Compliance
- **Non-Negotiable:**
  - "Ensure data privacy, secure API key handling": All API keys must be managed via Vercel environment variables and SSR-protected
  - "2 free voice-to-voice minutes for new users": Enforce usage limits at API and database level via Supabase RLS

## App Flow Integration
- **Stack-Aligned Flow:**
  - Next.js 14 Auth Flow → `app/auth/login/page.tsx` uses server actions for Supabase auth
  - Voice Session Flow → `app/(dashboard)/session/[sessionId]/page.tsx` uses SSE/WebSockets for real-time voice via Elevenlabs
  - Analysis Result Flow → `app/(dashboard)/session/[sessionId]/analysis/page.tsx` backed by `app/api/analysis/route.ts`
  - Billing Flow → `app/(dashboard)/billing/page.tsx` integrates Stripe via `app/api/stripe-webhook/route.ts`

### Input Context (Priority Order):  
1. `techStackDoc` (exact versions + routing patterns)  
2. `prd` (version-dependent requirements)  
3. `appFlow` (route-to-component mapping)  
4. `answers` (e.g., "We chose App Router for RSCs")
---