# Project Overview

*  **Type:** B2B SaaS Web Application
*  **Description:** B2B SaaS platform for sales professionals to practice and improve skills using AI-powered, voice-to-voice simulations and analysis.
*  **Primary Goal:** Develop a B2B SaaS platform that helps sales professionals improve skills through AI-powered, voice-to-voice simulations and analysis.

## Project Structure

### Framework-Specific Routing

*  **Directory Rules:**
   *  `next@14`: use `app/[route]/page.tsx` conventions (App Router)
   *  `next@13`: use `pages/[route].tsx` pattern (Pages Router)
   *  `react-router@6`: place route definitions in `src/routes/` using `createBrowserRouter`

### Core Directories

*  **Versioned Structure:**
   *  `app/api`: Next.js 14 API routes with Route Handlers
   *  `app/auth`: Auth pages and server actions (login, register)
   *  `app/dashboard`: Dashboard layouts and nested pages
   *  `src/components`: Shared React UI components and hooks
   *  `src/lib`: Utility functions, API clients, and type definitions

### Key Files

*  **Stack-Versioned Patterns:**
   *  `app/layout.tsx`: Next.js 14 root layout with global providers and metadata
   *  `app/page.tsx`: Next.js 14 landing page (Calendly integration)
   *  `app/api/voice/route.ts`: Elevenlabs voice session handler
   *  `app/api/analysis/route.ts`: GPT-4o conversation analysis handler
   *  `app/auth/login/page.tsx`: Supabase login form using server actions
   *  `next.config.js`: Next.js configuration with environment variables and image domains

## Tech Stack Rules

*  **Version Enforcement:**
   *  `next@14`: App Router required, disable `getInitialProps`
   *  `node@18`: ES modules, top-level await enabled
   *  `typescript@5`: `strict` mode enabled, no `any`
   *  `supabase@2`: Postgres RLS enforced, use Edge Functions optionally
   *  `stripe@latest`: Use Stripe SDK v3 with webhooks
   *  `@supabase/auth-helpers@latest`: Next.js/Supabase auth integration
   *  `resend@1`: Next.js Mailer for transactional emails

## PRD Compliance

*  **Non-Negotiable:**
   *  "Free trial with limited minutes.": implement minute cap on trial sessions
   *  "Stripe billing integration.": subscription tiers and usage-based billing must use Stripe
   *  "Voice-to-voice dialogue functionality.": real-time audio streaming via Elevenlabs API
   *  "GDPR compliance for user data.": enforce data purging policies and RLS

## App Flow Integration

*  **Stack-Aligned Flow:**
   *  Next.js 14 Auth Flow → `app/auth/login/page.tsx` & `app/auth/register/page.tsx` using server actions and Supabase
   *  Session Flow → `app/session/[sessionId]/page.tsx` for voice interaction UI and live feedback
   *  Billing Flow → `app/billing/page.tsx` for Stripe checkout and webhook handling

## Best Practices

*  Next.js 14 (App Router)
   *  Use `app/` directory exclusively for routes
   *  Prefer Server Components for data fetching
   *  Use Route Handlers in `app/api` for server logic
   *  Configure `middleware.ts` for auth redirects

*  React
   *  Use functional components and Hooks
   *  Keep components pure and stateless when possible
   *  Memoize expensive operations with `useMemo`/`useCallback`

*  TypeScript
   *  Enable `strict` mode and `noImplicitAny`
   *  Define interfaces for all API responses
   *  Use runtime validation (e.g., `zod`) for external inputs

*  Node.js/Serverless
   *  Keep functions single-purpose and small
   *  Reuse Supabase client instance across handlers
   *  Handle and log errors explicitly

*  Supabase
   *  Enforce row-level security for tenant isolation
   *  Store secrets in environment variables
   *  Use Edge Functions for custom backend logic where latency is critical

*  Stripe
   *  Validate webhook signatures in `app/api/webhooks/stripe/route.ts`
   *  Use idempotency keys for payment retries
   *  Sync subscription status in Supabase via webhooks

*  Elevenlabs API
   *  Stream audio via Edge Functions for low latency
   *  Cache model IDs and voice presets
   *  Handle rate limits and fallback gracefully

*  OpenAI API
   *  Use streaming for real-time analysis
   *  Limit tokens per request and handle 429 errors
   *  Secure API keys and rotate periodically

*  Resend
   *  Use Next.js Mailer integration (`app/api/email/route.ts`)
   *  Template emails with HTML/MJML
   *  Track deliveries, opens, and bounces

*  Vercel
   *  Encrypt environment variables in dashboard
   *  Use `vercel.json` to configure Edge Functions
   *  Enable Preview Deployments for PRs

## Rules

*  Derive folder/file patterns directly from `techStackDoc` versions.
*  If Next.js 14 App Router: enforce `app/` directory with nested routes.
*  If Pages Router: use flat `pages/*.tsx` structure.
*  Mirror this logic for React Router, SvelteKit, etc.
*  Never mix routing patterns (e.g., no `pages/` in App Router projects).

## Rules Metrics

Before starting project development, create a metrics file called `cursor_metrics.md` in the root.

### Instructions:
*  Each time a cursor rule is used as context, update `cursor_metrics.md`.
*  Use the following format:

# Rules Metrics

## Usage
The number of times rules is used as context

*  rule-name.mdc: 5
*  another-rule.mdc: 2
*  ...other rules