# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

B2B SaaS Sales Training App with ElevenLabs AI - A comprehensive platform for sales professionals to practice and improve their pitch through live, voice-to-voice AI simulations with real-time feedback and performance analysis.

## Essential Commands

### Development Setup
```bash
# Install dependencies (run from project root)
npm install                    # Installs workspace dependencies
cd frontend && npm install     # Frontend Next.js dependencies  
cd backend && npm install      # Backend Vercel functions dependencies

# Start development
npm run dev                    # Runs Next.js frontend on localhost:3000
cd backend && npm run dev      # Runs Vercel dev environment for backend functions

# Build and production
npm run build                  # Builds Next.js for production
npm run start                  # Starts production Next.js server
cd frontend && npm run lint    # Runs ESLint on frontend code
```

### Database Operations
```bash
# Apply database schema to Supabase
# 1. Copy contents of infra/supabase/setup.sql
# 2. Paste and execute in Supabase Dashboard SQL Editor
# 3. Verify with: SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'salesai_%';

# Quick schema check
# Run in Supabase SQL Editor:
# SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'salesai_%' ORDER BY table_name;
```

### Testing Voice Integration
```bash
# Test ElevenLabs connection
cd frontend && npm run dev
# Navigate to localhost:3000 → Try Free Demo → Start Training
# Success indicator: "Connected to live AI trainer!" message
```

## Architecture Overview

### Monorepo Structure
- **Root**: Workspace manager with shared Next.js/React dependencies
- **frontend/**: Next.js 14 App Router application with Tailwind CSS
- **backend/**: Vercel serverless functions for API routes
- **infra/**: Supabase database schema with `salesai_` prefixed tables

### Key Technologies
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Vercel Functions, TypeScript, Supabase client
- **Database**: Supabase (PostgreSQL with Row-Level Security)
- **AI Integration**: ElevenLabs API (voice), OpenAI GPT-4o (analysis)
- **Authentication**: Supabase Auth with middleware-based protection
- **State Management**: Zustand for client state
- **Payments**: Stripe integration
- **Email**: Resend API

### Critical Architecture Patterns

#### Next.js App Router Implementation
- **Route Protection**: `middleware.ts` handles auth checks at edge
- **Protected Routes**: `/dashboard`, `/session`, `/settings`, `/billing`
- **Public Routes**: `/`, `/pricing`, `/contact`, `/demo-request`
- **Server Components**: Default for data fetching and auth checks
- **Client Components**: Only when interactivity/hooks required

#### Database Schema Design
- **Multi-tenancy**: All tables prefixed with `salesai_` for isolation
- **Core Entities**: Companies → Profiles → Sessions → Transcripts/Analysis
- **Security**: Row-Level Security (RLS) policies on all tables
- **Performance**: Optimized indexes for common query patterns

#### ElevenLabs Voice Architecture
- **Agent Setup**: Requires pre-configured Conversational AI Agent
- **Session Flow**: Connection → Real-time Audio Stream → Recording → Analysis
- **Critical Environment Variables**: 
  - `ELEVENLABS_API_KEY`: API authentication
  - `ELEVENLABS_AGENT_ID`: Specific agent configuration

#### Authentication & Security
- **Supabase Auth**: Handles user sessions and JWT tokens
- **Client Patterns**: `lib/supabase.ts` for browser, SSR client for server
- **Service Operations**: Service role key for admin functions in API routes
- **Middleware**: Edge-based auth checks for route protection

### Environment Configuration Requirements

#### Essential API Keys
```env
# Supabase (Database & Auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ElevenLabs (Voice Training - CRITICAL)
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_AGENT_ID=your-agent-id

# Additional Services
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=your-stripe-key
RESEND_API_KEY=your-resend-key
```

#### File Locations
- **Development**: `frontend/.env.local`
- **Production**: `frontend/.env.production` + Vercel Dashboard
- **Template**: `.env.example` in project root

## Development Guidelines

### Component Organization
- **Pages**: App Router pages in `frontend/app/` directories
- **Components**: Reusable UI in `frontend/components/` (PascalCase)
- **Utilities**: Helper functions in `frontend/lib/` (camelCase)
- **API Routes**: Backend functions in `backend/` and `frontend/app/api/`

### Database Development Workflow
1. Modify `infra/supabase/setup.sql` (complete schema + sample data)
2. Update individual schema/policy files if needed
3. Apply via Supabase Dashboard SQL Editor
4. Test RLS policies with different user roles

### ElevenLabs Integration Development
1. Verify Agent ID exists in ElevenLabs Dashboard
2. Test voice connection independently before UI integration
3. Handle WebRTC audio streaming errors gracefully
4. Implement proper session state management

### Code Quality Standards
- **TypeScript**: Strict mode enabled, avoid `any` types
- **Next.js Patterns**: Prefer Server Components, minimize client boundaries
- **Database Access**: Always use RLS-compliant queries
- **Error Handling**: Graceful degradation for API failures
- **Security**: Never expose service role keys to client

## Critical Implementation Details

### Database Schema Prefix System
All tables use `salesai_` prefix to avoid conflicts in shared Supabase instances. This enables safe multi-project deployment without table name collisions.

### Voice Training Session Architecture
Sessions require real-time bidirectional audio streaming between user and ElevenLabs AI Agent. The flow involves WebRTC connections, session recording, and post-session AI analysis using OpenAI GPT-4o.

### Authentication Middleware Pattern
`middleware.ts` performs auth checks at Vercel Edge Runtime before page rendering, providing optimal performance and security for protected routes.

### Multi-tenant Data Architecture
Companies serve as tenant roots with cascading relationships: Companies → Profiles → Sessions → Analysis data, with RLS ensuring proper data isolation.