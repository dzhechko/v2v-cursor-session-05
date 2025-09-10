# Unified Project Documentation

## Project Requirements Document

### Project Overview

This project is a B2B SaaS platform that helps salespeople practice and improve their pitching skills through live, voice-to-voice sessions with an AI agent. On the public site, visitors can book a live demo using Calendly. In the MVP, new users register, fill in some personal details, and provide their own Elevenlabs and OpenAI API keys. They then start real-time sales role-plays with the Elevenlabs AI Agent and receive detailed feedback powered by GPT-4o.

The main objectives are to deliver a realistic training environment, provide actionable feedback on sales techniques, and guide users toward a paid subscription after a free trial. Success is measured by user engagement (completed sessions), user satisfaction (quality of feedback), and conversion rate from trial to paid plans. Building this now lets us validate core AI-driven coaching, secure early adopters, and refine our subscription model.

### In-Scope vs. Out-of-Scope

**In-Scope**

- Landing page with Calendly demo booking
- User registration with name, email, company, position, phone, team size
- Two free voice-to-voice minutes trial
- API key entry (Elevenlabs Agent Key & ID, OpenAI GPT-4o Key)
- Real-time voice training sessions using Elevenlabs API
- Post-session analysis via Elevenlabs and GPT-4o
- Roles: Super Admin, Admin, User with appropriate permissions
- Stripe billing integration with tiered minutes plans and overage fees
- Supabase (PostgreSQL) for data storage and authentication
- Deployment on Vercel with serverless functions
- GDPR compliance for user data and transcripts
- Email notifications (session summaries, receipts, trial reminders) via Resend

**Out-of-Scope**

- Built-in API keys for paid users (deferred to later version)
- Custom Calendly form fields beyond standard
- Onboarding flows for non-English/Russian languages
- ISO27001 or SOC2 certification at MVP stage
- Separate databases per tenant (using shared DB with row-level security)
- Advanced AI language support beyond US English and Russian
- Deep branding guidelines (assumed generic blue-and-white)
- Offline or desktop versions

### User Flow

A typical visitor lands on the marketing site and sees a clear call-to-action to book a demo or sign up directly. Clicking the demo button opens the Calendly widget where they provide basic details and schedule a time. If they choose to register, they fill out a form with their name, email, company, position, phone, and team size. After verifying their email, they log in for the first time and enter the required API keys, then land on their personal dashboard showing free minutes and subscription status.

From the dashboard, users click “Start Practice” to launch a live, voice-to-voice session with the AI agent. They see a timer and live transcript panel as they role-play sales scenarios. When they finish, they press “Analyze Conversation,” which sends the audio and transcript to Elevenlabs and GPT-4o, then displays a report with metrics like talk time, filler words, pace, sentiment, and specific sales skill feedback. If they run out of free minutes, the app prompts them to upgrade via Stripe. Admins and Super Admins have extra menus to invite users, assign minute quotas, view company or platform usage, and handle billing settings.

### Core Features

- Landing Page & Demo Booking: Modern UI with integrated Calendly widget offering multiple event types and durations. Users can book a live product demo without leaving the site.
- User Registration & Free Trial: Secure signup form capturing personal and company details, granting two free voice training minutes upon email verification.
- API Key Configuration (MVP): Guided UI for inputting Elevenlabs Agent API Key, Agent ID, and OpenAI GPT-4o API Key, including code-snippet help.
- Real-Time Voice Training: Bi-directional audio streaming with Elevenlabs AI Agent, showing live transcription and session timer against user’s minute balance.
- Conversation Analysis & Feedback: One-click analysis sending data to Elevenlabs and GPT-4o, producing metrics (talk time, filler words, pace, sentiment), skill-based feedback, and annotated transcript.
- Roles & Authentication: Supabase-backed auth with Super Admin, Admin, and User roles. Super Admins manage platform settings and billing; Admins manage users and quotas within their company.
- Stripe Billing & Licensing: Tiered subscription plans based on monthly minutes, overage fees, self-service upgrade/downgrade, and enterprise plans managed by Super Admins.
- Integrations: Calendly for demo booking, Elevenlabs for audio processing, OpenAI for analysis, Resend for email notifications.
- Deployment & DevOps: Serverless backend on Vercel, continuous deployment, Supabase hosting, and Row-Level Security for multi-tenant data separation.

### Tech Stack & Tools

**Frontend**: React with Next.js and TypeScript, styled with Tailwind CSS. Deployed on Vercel.

**Backend**: Node.js serverless functions on Vercel, TypeScript. Supabase (PostgreSQL) for database and auth.

**AI**: Elevenlabs API for real-time audio streaming and analysis, OpenAI GPT-4o for generating feedback.

**Billing & Scheduling**: Stripe integration for subscriptions and payments, Calendly widget for demo booking.

**Email**: Resend for transactional emails (session summaries, billing receipts, trial reminders).

**Dev Tools**: Claude Code, Windsurf IDE, Cline, Cursor IDE, Replit.

### Non-Functional Requirements

- Performance: Real-time audio latency under 200 ms; analysis response under 30 s.
- Security: All traffic over HTTPS; API keys encrypted at rest; JWT or Supabase tokens for auth; PCI compliance via Stripe; GDPR compliance for data privacy and user deletion requests.
- Reliability: 99.9% uptime SLA via Vercel and Supabase hosting.
- Scalability: Serverless architecture to handle spikes in training sessions.

### Constraints & Assumptions

- Users support only English (US accent) and Russian.
- Shared database with row-level security is sufficient for multi-tenancy.
- Calendly integration uses only standard form fields.
- API keys must be provided by users in MVP.
- Supabase handles authentication and RLS enforcement.
- Stripe covers payment PCI compliance.
- Resend handles email sending and deliverability.
- GDPR rules apply to EU users; transcripts must be deletable by users.
- Elevenlabs and OpenAI rate limits managed via retries or throttling.

### Known Issues & Potential Pitfalls

- Audio latency spikes can harm real-time practice. Mitigation: monitor streaming performance, fallback to lower-quality audio.
- API rate limits may slow analysis. Mitigation: queue requests and show user progress indicators.
- Large transcript storage could bloat the DB. Mitigation: apply retention policies and archive old sessions.
- Incorrect API key entries cause user frustration. Mitigation: validate keys immediately and show clear error messages.
- Multi-language support may need extension. Mitigation: design modular language settings.

## App Flow Document

### Onboarding and Sign-In/Sign-Up
A first-time visitor finds the landing page and either schedules a demo through an embedded Calendly widget or clicks "Sign Up." On the sign-up screen, they fill their name, email, company, position, phone, and team size. After submitting, they receive a verification email. Once they verify, they set a password. Users can also choose "Forgot Password" to get a reset link by email. Signing out is available in the top-right menu under "Log Out."

### Main Dashboard or Home Page
After logging in, users land on a clear dashboard showing their remaining free minutes, current subscription tier, and quick buttons to start a new practice, view past sessions, manage billing, or update settings. On the left side, a vertical navigation bar lists links to Practice, Reports, Billing, Settings, and Support Documentation. The header shows their name and role and offers a dropdown for account actions like logging out.

### Detailed Feature Flows and Page Transitions
When the user clicks "Start Practice," they move to the session page. Here they confirm mic and speaker settings, see a live timer, and the transcript panel. They talk with the AI agent until they click "End Session." The app then transitions to a loading screen while an analysis function runs. Once ready, it navigates to the report page displaying metrics and feedback. Admin users can go to an "Invite Users" page under Settings to add team members, assign minute quotas, and edit roles. Super Admins access a separate "Platform Settings" page for billing plans, license limits, and global usage stats.

### Settings and Account Management
In Settings, users update their personal details, change their password, or replace API keys in the MVP. They can also view and export their stored transcripts. Under Billing, they see current subscription info, available plans, and a button to open the Stripe-hosted billing portal for upgrades or downgrades. Admins see an extra tab to manage company details and minute quotas for team members. After any change, a "Back to Dashboard" link returns them to the main view.

### Error States and Alternate Paths
If a user enters invalid API keys, the app shows a clear message explaining which key failed and points them to the help docs. During poor connectivity, a banner warns of degraded audio and tries to reconnect. If analysis fails, users see a retry button and an apology note. When free minutes are exhausted, users are redirected to Billing and shown a prompt to upgrade. Payment failures surface a Stripe error and let users re-enter card details.

### Conclusion and Overall App Journey
From arriving on the marketing site to finishing a practice session, users experience a smooth flow: schedule or sign up, enter details and API keys, jump into a live AI conversation, and get instant feedback. Admins and Super Admins have extra panels to manage teams, quotas, and billing. Together, these flows deliver a complete training loop leading to subscription upgrades once free trials end.

## Tech Stack Document

### Frontend Technologies

- Next.js (React-based framework) for server-side rendering and optimal SEO, giving fast initial loads.
- React with TypeScript for type safety and clear component contracts.
- Tailwind CSS for utility-based styling, speeding up design consistency.
- Vercel for hosting, offering built-in CI/CD and global edge caching.

### Backend Technologies

- Node.js with TypeScript for serverless functions on Vercel, enabling easy scaling.
- Supabase (PostgreSQL) for a managed database, authentication, and row-level security.
- Serverless architecture to handle unpredictable traffic without overprovisioning.

### Infrastructure and Deployment

- Vercel for deployment of both frontend and backend functions, ensuring atomic CI/CD pipelines.
- GitHub for version control, linked to Vercel for automatic previews.
- Supabase hosting with automated backups and monitoring.
- MCP via Cursor for streamlined provisioning of Vercel and Supabase resources.

### Third-Party Integrations

- Stripe for subscription billing, self-service portal, and PCI compliance.
- Calendly for demo scheduling with embeddable widgets.
- Elevenlabs API for real-time audio streaming and analysis.
- OpenAI GPT-4o for generating detailed feedback on conversations.
- Resend for transactional email sending (session summaries, billing receipts, reminders).

### Security and Performance Considerations

- HTTPS everywhere with TLS termination at Vercel.
- JWT or Supabase tokens for secure authentication flows.
- Encryption of sensitive data (API keys) at rest and in transit.
- Row-level security in Supabase to enforce tenant isolation.
- Caching static assets on the edge in Vercel.
- Lazy loading and code splitting in Next.js to reduce bundle size.

### Conclusion and Overall Tech Stack Summary

This stack combines React/Next.js and Tailwind for a responsive, maintainable frontend, with serverless Node.js functions and Supabase for a scalable, secure backend. Integrations like Stripe and Calendly speed up feature delivery, while Vercel’s CI/CD and global network ensure reliability. The result is a modern, performant platform aligned with our goal to quickly deliver AI-powered sales training.

## Frontend Guideline Document

### Frontend Architecture

We use Next.js to blend server-side rendering, static-site generation, and client-side dynamic features. Each page lives under `pages/`, and shared code sits in `components/` and `lib/`. This approach scales as we add features, keeping page logic, API calls, and UI separate. Vercel’s edge network delivers pre-rendered pages close to users, improving load times.

### Design Principles

We prioritize clarity, ease of use, and accessibility. Buttons have clear labels, forms guide users step by step, and color contrast meets WCAG AA standards. The layout is fully responsive so users on desktop or mobile get the same intuitive experience.

### Styling and Theming

We use Tailwind CSS for utility-first styling. Our color palette centers on blue (#1e40af) for primary actions and white/diverse grays for backgrounds. We follow a flat design aesthetic—no heavy shadows or gradients—to keep the interface clean. Fonts are from the Inter family for readability.

### Component Structure

Components live under `components/` grouped by feature. We follow an atomic design pattern: Atoms (Button, Input), Molecules (FormRow, Modal), Organisms (Header, Sidebar), and Pages. Each component includes a `.tsx` file and a `.module.css` (if needed). Reusable logic goes into custom hooks under `hooks/`.

### State Management

Local UI state lives inside components or React Context for small global needs (like theme). For complex data fetching and caching, we use React Query, which keeps server state in sync and simplifies loading/error handling.

### Routing and Navigation

Routes mirror user flows: `/practice`, `/reports/[id]`, `/admin/users`, etc. Next.js file-based routing handles navigation. The sidebar highlights active links using `useRouter` and `router.pathname` to keep context clear.

### Performance Optimization

We lazy-load non-critical components with dynamic imports. Next.js automatically splits code at page boundaries. Images use `next/image` for optimized loading. We minimize unused CSS by purging Tailwind’s unused classes.

### Testing and Quality Assurance

Unit tests run under Jest and React Testing Library, focusing on component logic and visual snapshots. End-to-end tests use Cypress to simulate real user flows like signing up and starting a session. CI runs tests on every pull request and blocks merges on failures.

### Conclusion and Overall Frontend Summary

Our frontend setup balances performance, scalability, and ease of development. With Next.js and Tailwind, we deliver a responsive, accessible UI. Clear component organization, robust state management, and thorough testing ensure maintainability as we expand features.

## Implementation Plan

1. **Project Kickoff & Repo Setup**: Create mono-repo on GitHub, set up Next.js and Vercel integration, initialize Supabase project.
2. **Authentication & Database Schema**: Implement Supabase auth, define tables for users, companies, sessions, transcripts, roles, and quotas.
3. **Landing Page & Calendly**: Build marketing page, embed Calendly widget with multiple event types.
4. **Signup & Free Trial Flow**: Create registration form, email verification, free two-minute credit logic, welcome email via Resend.
5. **API Key Entry UI**: Add protected page for users to enter Elevenlabs and OpenAI keys, validate inputs.
6. **Session Page & Audio Streaming**: Develop microphone component, integrate Elevenlabs streaming API, show live transcript.
7. **Analysis Backend Function**: Write serverless function to send audio/transcript to Elevenlabs and GPT-4o, return feedback data.
8. **Report Page**: Build UI for displaying metrics, annotated transcript, and improvement suggestions.
9. **Stripe Billing**: Integrate Stripe, define pricing tiers, build billing portal link, handle webhooks for subscription events.
10. **Roles & Admin Panels**: Implement Super Admin and Admin views, user invitations, quota assignments, usage report pages.
11. **Settings & Notifications**: Develop profile and settings pages, allow API key updates, set up Resend templates for session summaries and billing emails.
12. **Testing & QA**: Write unit tests, integration tests, and end-to-end flows in CI pipeline.
13. **Security Review & GDPR Compliance**: Audit data flows, ensure encryption, implement data deletion flows for GDPR.
14. **Performance Tuning**: Optimize code splitting, caching policies, and monitor real-time audio latency.
15. **Beta Launch & Feedback**: Deploy to production, onboard initial users, collect feedback, and iterate on UI and features.

This plan gives a clear roadmap from initial setup to beta launch, ensuring each critical feature is built, tested, and deployed in logical order.