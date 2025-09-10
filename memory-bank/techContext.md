# Technical Context

## Technology Stack
**Full-Stack TypeScript Architecture**

### Frontend Stack
- **Framework**: React + Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: CSS modules or styled-components
- **UI Components**: Custom voice UI components
- **Fonts**: Inter/Roboto for accessibility

### Backend Stack
- **Runtime**: Node.js serverless functions
- **Platform**: Vercel Functions
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL + Auth + RLS)

### Core Integrations
- **AI Voice**: ElevenLabs API (streaming + analysis)
- **AI Analysis**: OpenAI GPT-4o API
- **Payments**: Stripe (subscriptions + billing)
- **Scheduling**: Calendly API (demo booking)
- **Email**: Resend (notifications + transactional)

## Development Environment
- **Node.js**: v20.2.1 (specific version requirement)
- **npm**: >=8.19.2
- **IDE**: Cursor IDE with MCP support
- **AI Tools**: Claude Code, Windsurf, Cline, Replit

## Build & Deployment
- **Hosting**: Vercel (auto-scaling serverless)
- **CI/CD**: Vercel pipelines (GitHub integration)
- **Infrastructure**: MCP via Cursor for provisioning
- **Environment**: Production/staging/development

## Dependencies
### Critical Dependencies
- `@supabase/auth-helpers`: Next.js auth integration
- `stripe`: Payment processing SDK
- `resend`: Email service SDK
- `axios`: HTTP client for API calls
- `calendly-react`: Calendly widget integration

### Development Dependencies
- `jest`: Testing framework
- `cypress`: E2E testing
- `@types/*`: TypeScript definitions

## Infrastructure
- **Database**: Supabase PostgreSQL with RLS
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage (if needed)
- **CDN**: Vercel Edge Network
- **Monitoring**: Built-in Vercel analytics
