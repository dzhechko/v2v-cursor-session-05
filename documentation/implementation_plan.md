# Implementation plan

## Phase 1: Environment Setup

1. **Prevalidation**: In your terminal, run `pwd` and `ls -A` to confirm you are in the project root and no initialization is needed if files like `package.json` or `.git` exist. (Custom Check)
2. **Install Node.js**: Ensure Node.js v20.2.1 is installed. If not, download and install from https://nodejs.org/dist/v20.2.1/. (Tech Stack Document)
3. **Validation**: Run `node -v` to confirm output is `v20.2.1`. (Custom Check)
4. **Install npm**: Ensure you have npm (comes with Node.js v20.2.1). Run `npm -v` and confirm >=8.19.2. (Custom Check)
5. **Initialize Git**: If no Git repo exists, run `git init` in the project root. (Custom Check)
6. **Create cursor_metrics.md**: In project root, `touch cursor_metrics.md`. Reference `cursor_project_rules.mdc` to structure metric tracking. (Tech Stack Document)
7. **Create .cursor directory**: `mkdir -p .cursor` in the project root. (Tech Stack Document)
8. **Create .cursor/mcp.json**: In `.cursor`, `touch mcp.json`. (Tech Stack Document)
9. **Add to .gitignore**: Append `.cursor/mcp.json` to `.gitignore`. (Tech Stack Document)
10. **Configure MCP for Supabase**: Open `.cursor/mcp.json` and add:
    ```json
    {
      "mcpServers": {
        "supabase": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-postgres", "<connection-string>"]
        }
      }
    }
    ```
    (Tech Stack Document)
11. **Get Supabase connection string**: Visit https://supabase.com/docs/guides/getting-started/mcp#connect-to-supabase-using-mcp and copy your `postgres://...` URL. Replace `<connection-string>` in `.cursor/mcp.json`. (Tech Stack Document)
12. **Verify MCP connection**: In Cursor IDE, open **Settings/MCP** and confirm a green active status for `supabase`. (Tech Stack Document)

## Phase 2: Frontend Development

13. **Initialize Next.js 14 App**: In `./frontend`, run:
    ```bash
    npx create-next-app@14.0.0 . --typescript
    ```
    (Tech Stack Document)
    > Note: We pin to Next.js 14 for optimal LLM tool support.
14. **Install Frontend Dependencies**: In `./frontend`, run:
    ```bash
    npm install axios calendly-react
    ```
    (Tech Stack Document)
15. **Create Landing Page**: Create file `/frontend/pages/index.tsx` with a Calendly embed for demo booking. (PRD Section 3.1)
16. **Embed Calendly**: In `/frontend/pages/index.tsx`, add:
    ```tsx
    <iframe src="https://calendly.com/your-team/demo?embed_domain=..." />
    ```
    (PRD Section 3.1)
17. **Validation**: Run `npm run dev` and confirm the landing page loads and Calendly widget displays. (Custom Check)
18. **Create Registration Page**: Create `/frontend/pages/register.tsx` with a form collecting name, email, company, position, phone, and team size. (PRD Section 3.2)
19. **Form Validation**: Add client-side validation per Q&A: Form Handling (e.g., regex for email, required fields). (Q&A: Form Handling)
20. **Connect to Auth API**: In `/frontend/services/auth.ts`, export a function using `axios.post('/api/auth/register', formData)`. (App Flow: Step 2)
21. **Validation**: Write a Jest test for `register` service and run `npm test`. (Q&A: Testing)

## Phase 3: Backend Development

22. **Setup Vercel Functions Dir**: In project root, create `/backend/functions`. (Tech Stack Document)
23. **Implement Registration Function**: Create `/backend/functions/auth/register.ts` with a POST handler that calls Supabase Auth to sign up a user and stores profile data. (PRD Section 3.2, Tech Stack Document)
24. **Validation**: Test the endpoint with:
    ```bash
    curl -X POST http://localhost:3000/api/auth/register -d '{"email":"x@x.com","password":"Pass123!"}'
    ```
    and expect a 200 response. (Custom Check)
25. **Define Supabase Schema**: Create `/infra/supabase/schema.sql` with tables:
    • `profiles` (id, auth_id, company, position, phone, team_size, role, created_at)
    • `sessions` (id, profile_id, start_ts, end_ts)
    • `feedback` (id, session_id, metrics JSON, created_at)
    • `subscriptions` (id, profile_id, plan_id, status, created_at)
    • `usage` (id, profile_id, minutes_used, period_start)
    (PRD Section 3.11)
26. **Run Schema via MCP**: In project root, execute:
    ```bash
    npx @modelcontextprotocol/server-postgres "<connection-string>" < infra/supabase/schema.sql
    ```
    (Phase 1 Steps)
27. **Validation**: Open Supabase Studio and confirm the tables exist. (Custom Check)
28. **Add RLS Policies**: Create `/infra/supabase/policies.sql`:
    ```sql
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Profiles: owner only" ON profiles FOR SELECT USING(auth.uid() = auth_id);
    -- repeat for other tables
    ```
    (PRD Section 3.11)
29. **Deploy Policies via MCP**:
    ```bash
    npx @modelcontextprotocol/server-postgres "<connection-string>" < infra/supabase/policies.sql
    ```
    (Phase 1 Steps)
30. **Session Endpoint**: Create `/backend/functions/session.ts` to handle real-time audio via Elevenlabs Streaming API, using the user’s API key stored in profile. (PRD Section 3.4)
31. **Feedback Endpoint**: Create `/backend/functions/feedback.ts` that calls OpenAI GPT-4o to analyze transcript and compute metrics (talk time, filler words, pace, sentiment). (PRD Section 3.5)
32. **Validation**: Write Jest tests in `/backend/tests` for both functions and run `npm test`. (Q&A: Testing)
33. **Stripe Billing**: In `/backend/functions/billing.ts`, integrate Stripe to create subscriptions and webhooks for usage tracking. (PRD Section 3.6)
34. **Resend Notifications**: In `/backend/functions/notifications.ts`, integrate Resend to send session summaries and billing receipts. (PRD Section 3.8)
35. **Validation**: Use Stripe CLI to send test webhooks and verify emails are sent. (Custom Check)

## Phase 4: Integration

36. **Frontend–Backend Auth**: In `/frontend/pages/register.tsx`, submit form to `/api/auth/register` via `services/auth.ts` and handle responses. (App Flow: Step 2)
37. **Voice UI**: Create `/frontend/pages/session.tsx` using Web Audio API to capture mic and play AI audio via WebSocket connected to `/api/session`. (App Flow: Step 4)
38. **Display Feedback**: In `/frontend/pages/feedback.tsx`, fetch `/api/feedback?sessionId=...` and render metrics and summary. (App Flow: Step 5)
39. **Validation**: Write a Cypress E2E test covering signup → session → feedback flow. (Q&A: Pre-Launch Checklist)

## Phase 5: Deployment

40. **CI/CD Pipeline**: Create `/infra/github/actions/deploy.yml` to install deps, run tests, and deploy to Vercel on `main` push. (Tech Stack Document)
41. **Configure Vercel**: In Vercel Dashboard, add environment variables:
    • `SUPABASE_URL`
    • `SUPABASE_SERVICE_ROLE_KEY`
    • `NEXT_PUBLIC_*` variables for Elevenlabs, OpenAI, Stripe, Resend
    (Tech Stack Document)
42. **Link Repo & Deploy**: Connect the GitHub repo to Vercel, set branch to `main`, and trigger an initial deployment. (Tech Stack Document)
43. **Custom Domain & HTTPS**: Add your custom domain in Vercel settings and enforce HTTPS. (PRD Section 6.2)
44. **Production Supabase**: In Vercel, add a second MCP config for production Supabase connection string in `.cursor/mcp.prod.json`, ignore it in `.gitignore`, and verify in Cursor **Settings/MCP**. (Tech Stack Document)
45. **Validation**: On the production URL, run through user registration, a short voice session, and verify billing and email flows. (Q&A: Pre-Launch Checklist)
46. **Performance Monitoring**: Integrate a monitoring tool (e.g., Sentry) in `/frontend` and `/backend` and validate error reporting. (Q&A: Error Handling)
47. **Localization Setup**: Configure Next.js i18n in `next.config.js` for English and Russian locales. (PRD Section 3.10)
48. **GDPR Compliance**: Add data deletion endpoint `/api/auth/delete-account` that removes user data from all tables. (Q&A: GDPR)
49. **Validation**: Submit account deletion request and confirm data is purged from Supabase. (Q&A: GDPR)
50. **Final Review**: Conduct a security audit, check RLS policies, and ensure all third-party keys are stored as environment vars. (Q&A: Security)

---

*End of plan. Total: 50 steps.*