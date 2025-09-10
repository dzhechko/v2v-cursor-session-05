# Implementation Plan for B2B SaaS Sales Training Simulator

This plan outlines a step-by-step approach to building the MVP, emphasizing security by design, compliance (GDPR), and best practices throughout.

---

## 1. Environment & Infrastructure Setup

- **Vercel Account & Projects**
  - Create separate Vercel projects for `staging` and `production`.
  - Enforce branch protection: only merge `main` via pull requests.
- **Supabase Provisioning**
  - Use MCP/Cursor scripts to provision a Supabase instance.
  - Enable Row-Level Security (RLS) by default.
- **Secrets Management**
  - Store API keys (Supabase, Stripe, Elevenlabs, OpenAI, Resend) in Vercel Environment Variables.
  - Do _not_ hardcode secrets; rotate periodically.
- **CI/CD Pipeline**
  - Configure Vercel’s built-in CI/CD: automatic deploys on merges to `main`.
  - Integrate SCA tool (e.g., GitHub Dependabot, Snyk) to scan dependencies.

## 2. Authentication & User Management

- **Supabase Auth**
  - Enable email/password sign-up with strong password policy (min 12 chars, complexity).
  - Configure secure session cookies: `HttpOnly`, `Secure`, `SameSite=Strict`.
  - Enforce absolute and idle timeouts (e.g., 12h absolute, 30m idle).
- **Roles & RBAC**
  - Define roles: `super_admin`, `admin`, `user` in Supabase.
  - Create Postgres policies limiting data access based on role and `company_id`.
  - Implement server-side authorization checks in each API route.
- **MFA (Optional for MVP)**
  - Plan to integrate TOTP-based MFA via Supabase Auth if timing allows.

## 3. Database Schema & Security

- **Schema Design**
  - Tables: `users`, `companies`, `sessions`, `analysis_results`, `billing`, `api_keys`, `stripe_subscriptions`.
  - Use UUID primary keys; avoid auto-increment.
- **RLS Policies**
  - `users`: owners see their own records; `admin` sees their company’s users; `super_admin` sees all.
  - `analysis_results` & `sessions`: only owner, their admins, and super_admin can read/write.
- **Encryption at Rest & In Transit**
  - Ensure Supabase storage is encrypted at rest.
  - All DB connections require TLS.

## 4. API & Serverless Functions Architecture

- **Framework**: Next.js API Routes (TypeScript)
- **Input Validation**
  - Use `zod` for schema validation of every request body, query, and path param.
- **Error Handling**
  - Return sanitized error messages (no stack traces).
  - Log detailed errors server-side to a secure logging service.
- **Rate Limiting**
  - Implement per-user rate limits (e.g., 100 req/min) using a Redis-based store or Vercel Edge Middleware.

## 5. Voice Interaction Integration

- **Elevenlabs Voice-to-Voice**
  - Create API route `/api/voice/session` to establish streaming session with Elevenlabs.
  - Proxy all audio streams through serverless functions to hide API keys.
- **Security Controls**
  - Validate audio payload size and format before forwarding.
  - Enforce per-session minute limits (free trial vs paid tiers).
- **Storage**
  - Store raw audio transcripts in Supabase Storage with restrictive ACL.
  - Encrypt files at rest.

## 6. AI Analysis Pipeline

- **Transcription & Metrics**
  - Use Elevenlabs SDK to transcribe and extract metrics (talk time, fillers).
  - Validate transcription output structure with `zod`.
- **GPT-4o Feedback**
  - Create an API route `/api/analysis` that:
    1. Fetches transcription & metrics.
    2. Sends a prompt to OpenAI with structured data.
    3. Parses and stores the response.
  - Set `max_tokens` and handle `rate_limit` errors gracefully.
- **Data Minimization**
  - Store only required analysis fields; do not persist raw OpenAI responses.

## 7. Billing & Subscription Management

- **Stripe Integration**
  - Use Stripe Checkout sessions for subscription flow.
  - Webhooks via `/api/stripe/webhook` to handle `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`.
- **Security**
  - Validate webhook signatures (use Stripe secret).
  - Store only Stripe Customer IDs, Subscription IDs in the DB.
- **Free Trial Logic**
  - Grant 2-minute trial credits on new user creation.
  - Update usage counter in DB and enforce block when exceeded.

## 8. Frontend Implementation (Next.js)

- **Public Pages**
  - Landing page with Calendly embed (use Calendly’s official widget script with SRI).
  - Documentation/FAQ pages.
- **Authenticated Dashboard**
  - Role-aware navigation: hide admin panels from regular users.
  - Voice session UI: record/playback controls, usage meter.
- **Client-Side Security**
  - Do not store API keys in browser storage.
  - Use `fetch` with CSRF tokens for mutation routes.
  - Implement CSP and security headers in `next.config.js`.

## 9. Email Notifications (Resend)

- **Transactional Emails**
  - Templates: session summary, billing receipt, trial expiration.
  - API route `/api/email/send` to wrap Resend SDK with input validation.
- **Security**
  - Rate-limit outgoing emails to prevent abuse.
  - Sanitize dynamic content to prevent injection.

## 10. Calendly Integration

- **Demo Scheduling**
  - Embed Calendly widget on landing page via their JS snippet.
  - Validate any returned callback data server-side if you use webhooks.

## 11. Security Hardening & Compliance

- **HTTPS Everywhere**: enforce HSTS (`max-age=31536000; includeSubDomains; preload`).
- **Security Headers**:
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin`
- **Logging & Monitoring**
  - Centralized logs (e.g., Sentry) with PII redaction.
  - Alerts on error spikes, unauthorized access attempts.
- **GDPR Compliance**
  - Data deletion requests: implement an endpoint to fully remove user data.
  - Data processing agreement with Supabase and Vercel.

## 12. Testing & QA

- **Unit & Integration Tests**
  - Use Jest for backend unit tests; React Testing Library for frontend.
  - Mock external APIs (Stripe, Elevenlabs, OpenAI, Resend).
- **End-to-End Tests**
  - Cypress for core user flows: sign-up, voice session, analysis, billing.
- **Security Testing**
  - Static Application Security Testing (SAST) on CI.
  - Penetration testing on staging before launch.

## 13. Deployment & Release

- **Staging Release**
  - Deploy to `staging` branch; QA sign-off required.
- **Production Release**
  - Merge to `main`; Vercel auto-deploys to production.
  - Smoke tests: critical API health checks.

## 14. Post-Launch Monitoring & Iteration

- **Usage Analytics**
  - Track session counts, minute usage, conversion rates.
- **Error Monitoring**
  - Real-time alerts for 500-level errors.
- **Feedback Loop**
  - Gather user feedback for refinements (e.g., additional metrics, language support).

---

This plan balances rapid MVP delivery with robust security, scalability, and compliance. Each phase builds on the last, ensuring the application is production-ready and secure by design.