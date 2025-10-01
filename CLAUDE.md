# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

B2B SaaS Sales Training App with ElevenLabs AI - A comprehensive platform for sales professionals to practice and improve their pitch through live, voice-to-voice AI simulations with real-time feedback and performance analysis.

## Commands

### Development
```bash
# Install dependencies (run from root)
npm install                    # Installs root workspace dependencies
cd frontend && npm install     # Installs frontend dependencies
cd backend && npm install      # Installs backend dependencies

# Development server
npm run dev                    # Runs frontend dev server (Next.js)
cd frontend && npm run dev     # Alternative way to run frontend

# Build and deployment
npm run build                  # Builds frontend for production
npm run start                  # Starts production server
cd frontend && npm run lint    # Runs ESLint on frontend code
```

### Backend Functions (Vercel)
```bash
cd backend
npm run dev                    # Runs Vercel dev environment
npm run deploy                 # Deploys to Vercel production
```

### Database Setup
```bash
# Apply database schema (run SQL files in Supabase Dashboard)
# 1. Apply infra/supabase/setup.sql in SQL Editor
# 2. All tables use 'salesai_' prefix to avoid conflicts
```

## Architecture

### Monorepo Structure
- **Root**: Workspace manager with shared dependencies
- **frontend/**: Next.js 14 app using App Router pattern
- **backend/**: Vercel serverless functions with TypeScript
- **infra/**: Database schema and infrastructure configs

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Vercel Functions, Node.js, TypeScript
- **Database**: Supabase (PostgreSQL with RLS)
- **AI Services**: ElevenLabs API (voice), OpenAI GPT-4o (analysis)
- **Auth**: Supabase Auth with middleware protection
- **Payments**: Stripe with webhooks
- **Email**: Resend API

### Key Architecture Patterns

#### Frontend (Next.js 14 App Router)
- **Route Structure**: Uses `app/` directory exclusively
- **Authentication**: Middleware-based route protection in `middleware.ts`
- **Protected Routes**: `/dashboard`, `/session`, `/settings`, `/billing`
- **Public Routes**: `/`, `/pricing`, `/contact`, `/demo-request`
- **API Routes**: Located in `app/api/` as Route Handlers

#### Database Design
- **Prefix**: All tables use `salesai_` prefix for multi-tenancy
- **Security**: Row-Level Security (RLS) enforced throughout
- **Schema Files**:
  - `infra/supabase/setup.sql`: Complete schema with data
  - `infra/supabase/schema.sql`: Schema only
  - `infra/supabase/policies.sql`: RLS policies only

#### Authentication Flow
1. Supabase Auth handles user sessions
2. `middleware.ts` enforces route-based access control
3. Server Components use Supabase SSR for auth state
4. Client Components use Supabase client for auth actions

#### Voice Training Architecture
- **ElevenLabs Integration**: Real-time voice conversations via API
- **Session Management**: Live session tracking and recording
- **Analysis Pipeline**: OpenAI GPT-4o processes conversation data
- **Feedback System**: Real-time performance analysis and coaching

### Critical Implementation Details

#### Environment Configuration
- **Frontend**: Uses `.env.local` for local dev, `.env.production` for Vercel
- **Required Keys**:
  - Supabase: URL, anon key, service role key
  - ElevenLabs: API key, Agent ID (critical for voice functionality)
  - OpenAI: API key for conversation analysis
  - Stripe: Secret key for payments
  - Resend: API key for emails

#### Supabase Client Patterns
- **Browser**: Use `lib/supabase.ts` with `createBrowserClient`
- **Server**: Use SSR client in middleware and server components
- **Service**: Use service role key for admin operations in API routes

#### ElevenLabs Voice Integration
- **Agent Setup**: Requires configured Conversational AI Agent in ElevenLabs
- **Real-time**: Voice sessions stream audio bidirectionally
- **Session Flow**: Start → Connect → Record → Analyze → Feedback

## Development Guidelines

### File Naming and Organization
- **Components**: PascalCase in `frontend/components/`
- **API Routes**: kebab-case in `frontend/app/api/`
- **Pages**: kebab-case directories with `page.tsx`
- **Utilities**: camelCase in `frontend/lib/`

### Code Conventions
- **TypeScript**: Strict mode enabled, no `any` types
- **Next.js**: Prefer Server Components, use Client Components only when needed
- **State Management**: Zustand for client state, Supabase for server state
- **Styling**: Tailwind CSS with custom design system tokens

### Testing and Quality
- **Linting**: ESLint with Next.js config
- **Type Checking**: TypeScript strict mode
- **Environment**: Validate all API keys are configured before development

### Security Considerations
- **RLS**: All database operations must respect Row-Level Security
- **API Keys**: Never commit keys to repo, use environment variables
- **Middleware**: Auth checks happen at edge for performance
- **CORS**: Configured in backend functions for API access

## Common Development Tasks

### Adding New Features
1. Check if database schema changes are needed in `infra/supabase/`
2. Create API routes in `frontend/app/api/` if backend logic required
3. Build UI components in `frontend/components/`
4. Add pages in `frontend/app/` following App Router conventions
5. Update middleware if new protected routes are added

### Database Changes
1. Modify `infra/supabase/setup.sql` with full schema + data
2. Update individual schema and policy files if needed
3. Apply changes via Supabase Dashboard SQL Editor
4. Test with local development environment

### ElevenLabs Voice Features
1. Ensure Agent ID is configured in environment
2. Test voice connection before implementing UI
3. Handle audio streaming errors gracefully
4. Implement session state management for voice calls

### Deployment
- **Frontend**: Auto-deploys to Vercel on git push
- **Backend**: Functions deploy with frontend
- **Database**: Manual SQL execution in Supabase Dashboard
- **Environment**: Configure production variables in Vercel Dashboard