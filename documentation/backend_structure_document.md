# Backend Structure Document

This document outlines the backend design, database details, APIs, hosting, infrastructure, security, and maintenance strategies for the Sales Training SaaS application. It is written in everyday language to ensure clarity for both technical and non-technical readers.

## 1. Backend Architecture

### Overall Design

We use a **serverless** approach powered by **Node.js** and **TypeScript**, deployed on Vercel. The code is organized into clear layers:

- **API Routes**: Entry points for HTTP requests.
- **Controllers**: Handle request validation and response formatting.
- **Services**: Encapsulate business logic (calling third-party APIs, processing data).
- **Repositories**: Manage database queries and data mapping.
- **Utilities & Helpers**: Common functions (authentication, error handling, logging).

### Design Patterns and Frameworks

- **Repository Pattern**: Keeps database logic separate from business logic.
- **Service Pattern**: Isolates core features (voice streaming, billing, email).
- **Dependency Injection** (simple factory style): Allows swapping implementations (mocking in tests).
- **Express-Style Middleware** in Vercel Functions: For CORS, authentication checks, error handling.

### Scalability, Maintainability & Performance

- **Auto-scaling**: Vercel Functions scale horizontally with traffic.
- **Separation of Concerns**: Each layer has a single responsibility, making updates and debugging straightforward.
- **Edge Caching & CDN**: Static assets and some API responses are cached at the edge for low latency.
- **Asynchronous Processing**: Long-running tasks (transcript storage, feedback analysis) can be offloaded to background jobs.

## 2. Database Management

### Technology Stack

- **Database Type**: Relational (PostgreSQL)
- **Provider**: Supabase (managed PostgreSQL + authentication + row-level security)

### Data Handling

- **Structured Tables** for core entities (users, companies, sessions, subscriptions).
- **JSONB Columns** for flexible data (feedback metrics, transcript details).
- **Row-Level Security (RLS)**: Ensures each user or company only sees their own data.
- **Migrations & Backups**: Managed via Supabase’s migration tool and nightly backups.
- **Connection Security**: Enforced SSL/TLS on all database connections.

## 3. Database Schema

Below is a human-friendly summary of our main tables, followed by SQL definitions.

### Human-Readable Schema

- **Users**: user credentials, profile info, role, encrypted API keys, links to a company.
- **Companies**: tenant info, Stripe customer ID, trial expiration.
- **Subscriptions**: stripe subscription record, plan tier, status, billing periods.
- **Sessions**: individual practice sessions with start/end times and status.
- **Transcripts**: session ID, full text, timestamp of creation.
- **Feedback**: metrics JSON (talk time, filler words, pace, sentiment, skill scores).
- **UsageRecords**: minutes used per session by each user.
- **MinuteQuotas**: total vs. used minutes allocated per company.

### SQL Table Definitions (PostgreSQL)
```sql
-- Users Table
enable row level security;
create table users (
  id             uuid      primary key default gen_random_uuid(),
  email          text      not null unique,
  hashed_password text     not null,
  name           text,
  role           text      not null check (role in ('super_admin','admin','user')),
  company_id     uuid      references companies(id),
  api_keys       jsonb, -- { "openai": "encrypted", "elevenlabs": "encrypted" }
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Companies Table
create table companies (
  id                  uuid      primary key default gen_random_uuid(),
  name                text      not null,
  stripe_customer_id  text,
  trial_expires_at    timestamptz,
  created_at          timestamptz default now()
);

-- Subscriptions Table
create table subscriptions (
  id                       uuid      primary key default gen_random_uuid(),
  company_id               uuid      references companies(id),
  stripe_subscription_id   text      not null,
  plan_id                  text      not null,
  status                   text      not null,
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

-- Sessions Table
create table sessions (
  id           uuid      primary key default gen_random_uuid(),
  user_id      uuid      references users(id),
  company_id   uuid      references companies(id),
  started_at   timestamptz default now(),
  ended_at     timestamptz,
  status       text      not null check (status in ('in_progress','completed','cancelled'))
);

-- Transcripts Table
create table transcripts (
  id             uuid      primary key default gen_random_uuid(),
  session_id     uuid      references sessions(id) on delete cascade,
  transcript_text text     not null,
  created_at     timestamptz default now()
);

-- Feedback Table
create table feedback (
  id           uuid      primary key default gen_random_uuid(),
  session_id   uuid      references sessions(id) on delete cascade,
  metrics      jsonb     not null, -- { talkTime: 120, fillerWords: 3, ... }
  created_at   timestamptz default now()
);

-- UsageRecords Table
create table usage_records (
  id           uuid      primary key default gen_random_uuid(),
  user_id      uuid      references users(id),
  session_id   uuid      references sessions(id),
  minutes_used integer   not null,
  created_at   timestamptz default now()
);

-- MinuteQuotas Table
create table minute_quotas (
  id            uuid      primary key default gen_random_uuid(),
  company_id    uuid      references companies(id),
  total_minutes integer   not null,
  used_minutes  integer   not null default 0,
  updated_at    timestamptz default now()
);
```

## 4. API Design and Endpoints

We follow a **RESTful** approach. All endpoints are behind HTTPS and require JWT authentication (except demo booking and signup).

### Authentication & User Management

- **POST /api/auth/register**: Create a new user, send verification email.
- **POST /api/auth/login**: Verify credentials, return JWT tokens.
- **GET /api/auth/verify-email?token=**: Activate account using emailed token.
- **POST /api/auth/resend-verification**: Resend the verification link.

- **GET /api/users/me**: Fetch current user profile.
- **PUT /api/users/me**: Update profile, upload API keys (encrypted server-side).

### Demo Booking

- **POST /api/demo/book**: Proxy to Calendly API to schedule a demo.

### Sessions & Conversations

- **POST /api/sessions/start**: Create a new session record, return session ID.
- **POST /api/sessions/:id/stream**: WebSocket or HTTP streaming for real-time audio to Elevenlabs.
- **POST /api/sessions/:id/end**: Mark session complete, trigger transcript & feedback jobs.
- **GET /api/sessions/:id/transcript**: Retrieve stored transcript text.
- **GET /api/sessions/:id/feedback**: Fetch AI-generated feedback metrics.

### Billing & Subscriptions

- **POST /api/subscriptions/subscribe**: Create or update subscription via Stripe SDK.
- **GET /api/subscriptions**: List current subscription and usage.
- **POST /api/webhooks/stripe**: Handle Stripe events (invoice paid, trial ending).

### Admin Endpoints (Super Admin & Company Admin)

- **GET /api/admin/users**: List users (filtered by company).
- **GET /api/admin/companies**: List all companies (Super Admin only).
- **POST /api/admin/quotas**: Allocate minute quotas to companies or users.

## 5. Hosting Solutions

- **Vercel**
  - Hosts serverless functions (APIs).
  - Serves frontend static assets via global CDN.
  - Automatic SSL certificates and domain management.
- **Supabase**
  - Managed PostgreSQL, Auth, and RLS policies.
  - Nightly backups and high availability.
- **Cursor MCP**
  - Manages cloud provisioning and environment consistency.

Benefits:
- No server maintenance or capacity planning.
- Pay-as-you-grow pricing.
- Built-in CI/CD: every GitHub push triggers a deploy.

## 6. Infrastructure Components

- **Load Balancer & Auto-Scaling**: Handled by Vercel’s edge network.
- **CDN**: Vercel serves static files and caches frequently accessed JSON.
- **Database**: Supabase Postgres cluster.
- **Caching**: Edge caching on Vercel; application-level caching (in-memory or Redis) for frequent reads.
- **Message Queue** (future): For background jobs (transcript processing, feedback generation).
- **Webhooks Receiver**: Keeps billing and external events in sync (Stripe, Calendly).
- **Email Service**: Resend handles transactional emails.
- **Monitoring & Logging**: Vercel logs + Sentry for errors + Supabase logs.

## 7. Security Measures

- **Transport Security**: HTTPS/TLS enforced everywhere.
- **Authentication**: JWT tokens with short expiry, refresh tokens stored securely.
- **Authorization**: Supabase Row-Level Security ensures data isolation by company and role.
- **Password Storage**: Bcrypt hashing with salt.
- **API Key Handling**: Encrypted at rest (using built-in cloud KMS); never logged in plain text.
- **Input Validation & Sanitization**: All request bodies and query params validated.
- **CORS Policy**: Restricted to the official frontend domain.
- **Webhooks Verification**: Validate signatures for Stripe and Calendly callbacks.
- **GDPR Compliance**: Data deletion endpoints, consent tracking, and audit logs.

## 8. Monitoring and Maintenance

- **Error Tracking**: Sentry captures exceptions in serverless functions.
- **Performance Metrics**: Vercel Analytics shows response times and error rates.
- **Database Health**: Supabase dashboard monitors slow queries and connection counts.
- **Alerts & Notifications**: Slack or email alerts for critical failures.
- **Regular Backups & Migrations**: Automated via Supabase tools.
- **Dependency Updates**: Dependabot on GitHub + periodic manual reviews.
- **Uptime Checks**: Automated pings to key endpoints (login, start session).

## 9. Conclusion and Overall Backend Summary

This backend is built to support a multi-tenant, voice-driven SaaS for sales professionals. By leveraging serverless infrastructure on Vercel, a managed Postgres database via Supabase, and a clean layered architecture, we achieve:

- **Scalability**: Automatic scaling to handle peaks in practice sessions.
- **Maintainability**: Clear separation of layers makes it easy to add features and fix bugs.
- **Reliability**: Managed services minimize downtime and provide built-in backups.
- **Security & Compliance**: Strong authentication, encryption, and GDPR adherence.

Unique aspects include real-time audio streaming with Elevenlabs, AI-driven feedback from GPT-4o, and fine-grained row-level security for data isolation. This setup aligns with the project goals and ensures a smooth experience for admins and end users alike.