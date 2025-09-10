# App Flow Document for Sales Training SaaS Application

## Onboarding and Sign-In/Sign-Up

When a visitor arrives at the public landing page, they see a clear call-to-action offering to book a live demonstration via an embedded Calendly widget or to sign up for the application. If the visitor chooses to schedule a demo, the Calendly widget appears in a modal window without leaving the page, allowing them to pick an event type, select a date and time, and submit basic contact details such as name, email, company, and role. After booking, they receive an email confirmation from Calendly and are invited to sign up for the app if they wish to continue exploring on their own.

If the visitor clicks the Sign Up button instead, they are taken to a registration form within the same domain. They enter their name, email, company name, job title, phone number, and team size. Upon submitting this form, a new user account is created in Supabase, and the user receives a welcome email with a verification link. The email prompts them to verify their address and set a password. Until they verify, they cannot sign in.

Once the user clicks the verification link, they land on a password-set page where they choose a secure password. After setting the password, they can sign in with their email and new password. On the sign-in page, a Forgot Password link allows them to enter their email and receive a password reset link. Clicking that link brings them to a page to create a new password and then sign in. A Sign Out option is always available in the header menu after login, securely ending the user’s session.

## Main Dashboard or Home Page

After signing in for the first time, the user is prompted to enter their Elevenlabs AI Agent API Key, Elevenlabs AI Agent ID, and OpenAI GPT-4o API Key. Instructions and example snippets are shown inline to guide them. Once the keys are validated, the user lands on the main dashboard.

The dashboard features a left navigation bar with links labeled Start Practice, Session Reports, Billing, Settings, and Support. At the top of the page, the company logo appears in the header along with the user’s name and a drop-down menu for profile and sign-out. In the main pane, the user sees their remaining minutes for the free trial or paid plan, current subscription status, and a prominent Start Practice button. Below this, they find quick links to view recent session reports and upgrade their plan if needed.

From the dashboard, users click Start Practice to begin a new training session, click Session Reports to review past analyses, click Billing to manage subscriptions, or click Settings to update personal or company information. Support opens a knowledge base and contact form in a modal.

## Detailed Feature Flows and Page Transitions

### Starting a Voice Training Session

When the user clicks Start Practice, the screen transitions to a dedicated session page. The page displays a countdown timer, a microphone toggle button, and an empty transcript panel. The user confirms microphone access in their browser and clicks a Go Live button. The application begins streaming audio to the Elevenlabs AI Agent. As the user speaks and the agent responds, live transcription appears in the panel and the timer counts down against their available minutes. If the user reaches zero minutes, the session ends automatically.

### Ending and Analyzing a Conversation

At any point, the user can click End Session. The system stops the audio stream and displays an Analyze Conversation button. Clicking this triggers a serverless function that packages the audio recording and transcript, sends them to the Elevenlabs API for detailed voice analysis, then forwards the results to GPT-4o for skill evaluation. While processing, a spinner and progress message appear. Once complete, the user is redirected to a report page.

### Viewing Session Reports

On the report page, the user sees total talk time, filler word count, speaking pace, sentiment analysis, and skill-based feedback such as objection handling and closing techniques. The full transcript is shown with highlighted sections indicating strengths and improvement areas. A Back to Dashboard button returns the user to the main screen. From any report, the user can click Download PDF to save or click Share to upload the report link for teammates.

### Billing and Subscription Management

When free trial minutes run out or the user chooses to upgrade, they click the Billing link. This brings them to a Stripe-integrated billing portal that displays available plans—Starter, Pro, and Enterprise—with minute allowances and overage fees. The user selects a plan, enters payment details in a secure Stripe iframe, and submits. Upon approval, Stripe confirms the subscription and the dashboard updates with the new minute balance. The user can upgrade or downgrade at any time, with changes reflected immediately in their account.

### Admin Panel for Company Admins

Users with the Admin role see an additional Company Management link in the navigation. Clicking it opens a page where they invite new users by email, assign voice minute quotas to each user, and view aggregate usage reports for the entire company. Invitations sent generate emails with sign-up links that pre-associate the new user with the company. Company Admins cannot modify billing or platform settings.

### Super Admin Control Panel

Super Admins access a separate Platform Settings link in the header menu. This panel lets them create new Admin accounts, adjust global subscription pricing, view usage and revenue reports across all companies, and set default minute quotas. They can also manage license expiration dates and reset company quotas. Changes here apply to all tenants in the system.

## Settings and Account Management

The Settings page is accessible to all users via the sidebar. This page presents two tabs: Profile and API Keys. In Profile, users update their name, email, phone, company details, and team size. Changes are saved instantly to Supabase. In API Keys, users can view and replace their Elevenlabs Agent Key, Agent ID, and OpenAI Key. Validation occurs on save, and errors are shown inline if keys are invalid.

A Notifications section on the Settings page lets users toggle email alerts for session summaries, trial expiration reminders, and billing receipts. All preferences are stored in the database. From Settings, a Return to Dashboard link in the header takes the user back to the home screen.

## Error States and Alternate Paths

If the user enters an invalid email or password at sign-in, a clear inline error appears explaining the mistake. During password reset, expired or invalid reset links show a message prompting the user to request another. If API key validation fails, the API Keys tab highlights the incorrect credential and displays the error returned by the provider.

During a training session, loss of internet connectivity causes a warning banner and pauses the stream. The user can retry once connectivity returns. If the session timer hits zero unexpectedly, a modal informs the user that their minutes are exhausted and prompts them to upgrade. Attempting to access Admin or Super Admin pages without proper permissions redirects the user to an Unauthorized page with a link back to the dashboard.

## Conclusion and Overall App Journey

A new user begins by landing on the public site, booking a demo or signing up directly. They verify their email, set a password, and provide API keys for the MVP. The user then sees their dashboard showing free trial minutes and can launch a real-time voice practice session with the AI agent. Upon session completion, they request conversation analysis to receive detailed feedback on sales skills. When trial minutes end, they upgrade through the Stripe billing portal, which immediately unlocks more minutes. Company Admins manage team invitations and usage, while Super Admins oversee the entire platform. At every step, clear navigation, inline validations, and error handling ensure a smooth flow from account creation through everyday sales training and subscription management.