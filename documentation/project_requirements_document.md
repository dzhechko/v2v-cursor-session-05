# Project Requirements Document (PRD)

## 1. Project Overview

We are building a B2B SaaS web application that lets sales professionals practice and improve their pitch through a live, voice-to-voice simulator powered by Elevenlabs AI and GPT-4o. On a modern landing page, prospects can either schedule a live demo via Calendly or sign up immediately. Once inside, users start or record a realistic sales dialogue with an AI agent, then instantly receive detailed, AI-driven feedback on their performance—covering speaking pace, filler words, sentiment, objection handling, and more.

The purpose of this tool is to help sales teams sharpen their skills in a low-risk, repeatable environment. By combining real-time voice interaction with automated analysis and personalized coaching tips, we enable faster learning, consistent practice, and data-driven improvement. Success will be measured by user activation (demo bookings → sign-ups), average session minutes per user, subscription conversion rate after free trial, and positive feedback on the quality of insights.

## 2. In-Scope vs. Out-of-Scope

**In-Scope (MVP)**

*   Public landing page with Calendly demo booking integration
*   User registration flow: collect name, email, company, role, phone, team size
*   Enter and validate API keys (Elevenlabs Agent API Key + ID, OpenAI GPT-4o Key)
*   2-minute free trial credit for new users
*   Real-time voice-to-voice conversation UI with live transcription
*   “Analyze Conversation” feature: send data to Elevenlabs & GPT-4o, display feedback
*   Subscription billing via Stripe: tiered plans, upgrade/downgrade, overage fees
*   Role management: Super Admin / Admin / User with row-level security in Supabase
*   Database and auth on Supabase (PostgreSQL + RLS)
*   Deployment on Vercel with serverless functions in TypeScript/Node.js
*   GDPR-compliant storage of transcripts and user data
*   Notification emails (session summaries, billing receipts, trial reminders) via Resend

**Out-of-Scope (Later Phases)**

*   Built-in API keys for users (MVP requires manual entry)
*   Additional languages/accents beyond English and Russian
*   Custom Calendly form fields
*   Separate database schemas per tenant (we use shared DB + RLS)
*   Advanced certification (SOC2, ISO27001)
*   Mobile apps or offline support
*   In-app video demos or chat-only modes

## 3. User Flow

A visitor lands on the marketing site and sees a clear call-to-action to either “Book a Live Demo” (via an embedded Calendly widget) or “Sign Up Now.” If they choose the demo, they pick an event type, fill in standard fields, and confirm the slot—no account creation is required. If they sign up, they fill out name, email, company, role, phone number, and team size. After verifying their email, they receive two free voice-to-voice minutes and instructions to input their Elevenlabs and OpenAI API keys.

Inside the dashboard, users see their remaining minutes and subscription status. They click “Start Practice” to begin a live AI-led sales role-play: a timer tracks usage, a transcript panel shows real-time text, and audio streams both ways with minimal latency. After hanging up, they hit “Analyze Conversation.” Behind the scenes, serverless functions send recordings and transcripts to the Elevenlabs API for voice analysis, then to GPT-4o for evaluation. Within seconds, they get a detailed report on talk time, filler words, speaking pace, sentiment breakdown, skill-area scores, and a transcript annotated with improvement tips. If they exhaust free minutes, a prompt guides them to upgrade via Stripe.

## 4. Core Features

*   **Landing Page & Demo Booking**\
    • Modern design with blue-white theme, sans-serif font (Inter/Roboto)\
    • Embedded Calendly widget (multiple event types/durations)
*   **User Onboarding & API Configuration**\
    • Registration form (name, email, company, role, phone, team size)\
    • Email verification and secure password setup\
    • Input/validate Elevenlabs API Key & ID, OpenAI GPT-4o Key
*   **Voice-to-Voice Practice**\
    • Real-time bi-directional audio streaming\
    • Live transcription panel\
    • Session timer against minute balance
*   **Conversation Analysis & Feedback**\
    • Serverless analysis via Elevenlabs (audio insights) and GPT-4o (text + coaching)\
    • Metrics dashboard: total talk time, filler words, WPM, sentiment, skill scores\
    • Annotated transcript with suggestions
*   **Roles & Authentication**\
    • Supabase auth with row-level security\
    • Super Admin: platform-wide billing, licenses, minute quotas\
    • Admin: company-level user invites, minute allocation, usage reports\
    • User: practice sessions, view own reports
*   **Billing & Licensing**\
    • Stripe integration: Starter/Pro/Enterprise tiers, overages, self-serve upgrades\
    • 2-minute free trial for new accounts\
    • Billing portal embedded via Stripe
*   **Notifications & Emails**\
    • Session summary emails\
    • Billing receipts and invoices\
    • Trial expiration and low-minute reminders
*   **Deployment & DevOps**\
    • TypeScript/Node.js serverless functions on Vercel\
    • Supabase (Postgres + Auth)\
    • CI/CD automated via Vercel pipelines\
    • Infrastructure provisioning via MCP & Cursor

## 5. Tech Stack & Tools

*   **Frontend & Hosting:**\
    • React (Next.js) or plain React deployed on Vercel\
    • CSS-in-JS or Tailwind for styling
*   **Backend & Serverless:**\
    • TypeScript / Node.js serverless functions on Vercel\
    • Supabase (PostgreSQL, Authentication, Row-Level Security)
*   **Integrations & APIs:**\
    • Elevenlabs API for streaming & conversation analysis\
    • OpenAI GPT-4o API for feedback synthesis\
    • Calendly API for demo scheduling\
    • Stripe API for subscription and payments\
    • Resend.com for transactional emails
*   **AI Developer Tools:**\
    • Claude Code, Cline, Windsurf, Cursor IDE, Replit for collaborative coding
*   **Infrastructure as Code:**\
    • MCP (Managed Cloud Provisioning) via Cursor

## 6. Non-Functional Requirements

*   **Performance:**\
    • Voice streaming latency ≤ 300 ms round-trip\
    • Analysis response under 5 s after “Analyze” click
*   **Security & Compliance:**\
    • GDPR-compliant data storage, right to erasure\
    • Stripe handles PCI compliance for payments\
    • Secure handling of API keys (encrypted at rest, in transit)
*   **Scalability:**\
    • Horizontal scaling via serverless functions\
    • Supabase can handle multi-tenant row-level workloads
*   **Usability & Accessibility:**\
    • Responsive design for desktop and tablet\
    • Follow WCAG 2.1 AA standards for navigation, color contrast\
    • Clear error messages and guided form validation

## 7. Constraints & Assumptions

*   MVP requires users to provide their own Elevenlabs and OpenAI keys.
*   Shared database with row-level security is sufficient; no separate schemas needed.
*   Stripe covers payment security, but we must secure customer metadata.
*   Calendly integration uses standard fields; no custom questions in MVP.
*   English and Russian audio only in MVP; additional languages later.
*   Super Admin features assumed to be managed by an internal ops team.

## 8. Known Issues & Potential Pitfalls

*   **API Rate Limits:**\
    • Elevenlabs and OpenAI impose request caps—implement retry/back-off logic.
*   **Audio Latency & Quality:**\
    • Poor network conditions may degrade streaming; warn users and auto-retry.
*   **Transcript Accuracy:**\
    • Noise or accent variability can lower transcription quality; allow manual corrections.
*   **Billing Edge Cases:**\
    • Overage calculations and prorated upgrades must be tested thoroughly.
*   **Data Purging:**\
    • Must support GDPR “right to be forgotten”—ensure deletion of transcripts and personal data.
*   **Role Misconfiguration:**\
    • Misapplied row-level rules can leak data; enforce strict testing of RLS policies.

This PRD serves as the single source of truth for all future technical documents—frontend guidelines, backend architecture, CI/CD rules, and more—ensuring every detail is unambiguous and ready for implementation by AI-driven workflows.
