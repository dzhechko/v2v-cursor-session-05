# Tech Stack Document

This document explains the technology choices for our B2B SaaS sales-training application with an Elevenlabs AI Agent. It’s written in everyday language so that non-technical readers can understand why each piece was chosen and how it fits together.

## 1. Frontend Technologies

We want a smooth, responsive interface that feels modern and loads quickly. Here’s what we’re using:

• **React + TypeScript:**
  – React lets us build interactive user interfaces in a component-based way.
  – TypeScript adds type safety, which helps catch errors early and makes the code easier to maintain.

• **Next.js (Server-Side Rendering):**
  – Powers fast initial page loads and good SEO by rendering pages on the server.
  – Works seamlessly with Vercel for deployment.

• **Styling & Layout:**
  – Simple, mobile-friendly CSS modules or styled-components for consistent design.
  – Fonts like Inter or Roboto for readability.

• **Calendly Widget Integration:**
  – Embeds the demo-booking form directly on the landing page for a frictionless experience.

• **Real-Time Audio UI:**
  – Custom components for microphone control, live transcription display, and session timer.

These choices ensure a stable, attractive interface that users can navigate easily on any device.

## 2. Backend Technologies

The backend handles data storage, business logic, user management, and integrations. Here’s our stack:

• **Node.js + TypeScript (Serverless Functions):**
  – Runs on Vercel as isolated functions, scaling automatically with demand.
  – TypeScript keeps our codebase consistent and maintainable.

• **Supabase (PostgreSQL + Authentication):**
  – Our primary database for storing users, companies, session records, transcripts, and trial details.
  – Built-in authentication and row-level security (RLS) to isolate each tenant’s data.

• **Elevenlabs API:**
  – Streams voice-to-voice audio for live practice sessions.
  – Performs advanced conversation analysis.

• **OpenAI API (GPT-4o):**
  – Evaluates dialogues to generate feedback on sales skills, speaking pace, filler words, and sentiment.

• **Stripe:**
  – Manages subscription billing, payment processing, and tiered plans with overage fees.

• **Resend (Email Service):**
  – Sends welcome emails, session summaries, billing receipts, and trial-expiration reminders.

Together, these services power the core functionality—real-time practice, detailed analysis, user roles, and billing.

## 3. Infrastructure and Deployment

To make deployment reliable, repeatable, and easy to manage, we use:

• **Vercel (Hosting & CI/CD):**
  – Hosts both the frontend and serverless backend functions.
  – Automatic builds and deploys when code is pushed to Git.
  – Instant rollbacks if something goes wrong.

• **MCP via Cursor:**
  – Infrastructure provisioning and configuration managed through Cursor’s AI-driven setup workflows.

• **Version Control (Git + GitHub):**
  – All code lives in a Git repository for collaboration and history tracking.

• **Developer Tools & IDEs:**
  – **Claude Code, Windsurf, Cline, Cursor IDE, Replit** for AI-assisted coding, real-time suggestions, and collaboration.

This setup ensures that new features can go live quickly while maintaining high stability.

## 4. Third-Party Integrations

To avoid reinventing the wheel, we use proven services:

• **Calendly:**
  – Lets visitors book product demos with multiple event types and durations.

• **Stripe:**
  – Handles subscription plans (Starter, Pro, Enterprise), overage fees, and self-service upgrades/downgrades.

• **Elevenlabs API:**
  – Streams live voice sessions and conducts raw audio analysis.

• **OpenAI API:**
  – Processes transcripts to produce actionable feedback via GPT-4o.

• **Resend:**
  – Reliable email delivery for onboarding, notifications, and receipts.

Each integration adds specialty functionality while freeing us to focus on core features.

## 5. Security and Performance Considerations

We’ve built in safeguards and optimizations from day one:

• **GDPR Compliance:**
  – Users can view, export, or delete their personal data.
  – Secure storage of transcripts and trial data.

• **PCI Compliance (via Stripe):**
  – Stripe handles sensitive payment details, so we don’t store credit card information directly.

• **Supabase Row-Level Security:**
  – Ensures that one company’s data cannot be accessed by another.

• **Secure API Key Management:**
  – In MVP, users enter their own keys. In future versions, keys will be stored encrypted on our side.

• **HTTPS/TLS Everywhere:**
  – All traffic is encrypted in transit.

• **Performance Optimizations:**
  – Serverless auto-scaling handles variable load.
  – Next.js server-side rendering and code splitting speed up page loads.
  – Real-time audio streaming designed for low latency.

These measures keep user data safe and the experience snappy.

## 6. Conclusion and Overall Tech Stack Summary

Our choices reflect the project’s goals: a modern, scalable, and secure sales-training platform.

• **TypeScript + Node.js + React/Next.js** give us a unified codebase across frontend and backend.
• **Vercel + Serverless Functions** enable fast, automated deployments.
• **Supabase** provides a managed database with built-in auth and data isolation.
• **Stripe, Calendly, Elevenlabs, OpenAI, Resend** add critical capabilities without custom building.
• **MCP, Cursor, AI-powered IDEs** streamline infrastructure setup and development.

Together, these technologies ensure we can deliver a reliable product quickly, support rapid iteration, and keep user data secure. This stack is flexible enough to grow with future needs—whether adding more languages for the AI agent, expanding analytics, or pursuing compliance certifications like SOC2 down the road.

---

With this foundation, our team can focus on refining the learning experience and driving customer success, rather than wrestling with infrastructure or reinventing common services.