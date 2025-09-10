# Frontend Guideline Document

This document explains how the frontend of our B2B sales training platform is built and organized. It uses simple language so anyone—technical or not—can understand the setup.

## 1. Frontend Architecture

**What we use:**
- React with Next.js for building pages and handling server-side rendering.
- TypeScript to catch errors early and make code more reliable.
- Vercel for hosting and automatic deployments.

**How it supports our goals:**
- **Scalability**: Next.js splits code into pages and components. As we grow, we can add more pages without slowing down existing ones.
- **Maintainability**: TypeScript plus clear folder structure helps developers quickly find and update code.
- **Performance**: Next.js pre-renders pages and serves them from the edge, so users see content fast.

## 2. Design Principles

We follow three main ideas:

1. **Usability**:  The app must be easy to navigate, with clear buttons and labels. We use consistent layouts so users always know where they are.
2. **Accessibility**:  We make sure the platform works with keyboard-only navigation and screen readers. Color contrasts meet minimum standards for readability.
3. **Responsiveness**:  The interface adapts smoothly to phones, tablets, and desktops. Elements resize or stack as needed.

**How it shows up:**
- Buttons and links have clear text and enough space around them.
- Headings use semantic HTML (like `<h1>`, `<h2>`) for screen readers.
- Layouts use flexible grids and media queries to fit all screen sizes.

## 3. Styling and Theming

**Styling approach:**
- We use Tailwind CSS, a utility-first framework. It lets us write small, reusable classes like `bg-blue-500`, `p-4`, and `text-center` directly in our components.
- Tailwind’s configuration file defines all colors, fonts, and common spacing in one place.

**Theming and look & feel:**
- Style: Modern flat design with slight glassmorphism effects on key panels (e.g., feedback cards). This gives a light blur background with crisp, colorful text.
- Color Palette:
  - Primary Blue: `#1E40AF` (buttons, links)
  - Secondary Blue: `#3B82F6` (hover states, accents)
  - White: `#FFFFFF` (background)
  - Gray Shades: `#F3F4F6`, `#E5E7EB`, `#6B7280` (cards, borders, text)
  - Accent Green: `#10B981` (success messages)
  - Accent Red: `#EF4444` (errors)

**Fonts:**
- We use the Inter font family for its clean, modern look and excellent readability.

## 4. Component Structure

**Organization:**
```
/src
  /components    # Reusable UI pieces (buttons, inputs)
  /layouts       # Page wrappers (dashboard layout, public layout)
  /pages         # Next.js page files (landing, login, practice session)
  /hooks         # Custom React hooks (useAuth, useVoiceStream)
  /context       # React Context providers (AuthContext)
  /styles        # Global styles and Tailwind config
```

**Why component-based:**
- Breaks the UI into small, self-contained pieces.
- Reuse components (e.g., Button, Card) in many places without rewriting code.
- Makes testing easier, since each component does one thing.

## 5. State Management

**Approach:**
- **Local State**: We use React’s `useState` and `useReducer` for component-specific state (e.g., form inputs, modal open/close).
- **Global State**: We use React Context for user authentication status and session info.
- **Server State**: We use SWR (stale-while-revalidate) to fetch and cache data from our backend (e.g., user profile, billing status).

**Flow:**
1. On login, AuthContext stores a secure JWT token in an HTTP-only cookie.
2. Context provides user info to any component that needs it.
3. SWR fetches data with the token, updates the UI, and keeps data fresh in the background.

## 6. Routing and Navigation

**Library:** Next.js built-in router (`next/router`).

**Structure:**
- Pages folder maps directly to URLs. For example, `/pages/practice.tsx` becomes `/practice`.
- Nested folders for grouping related pages (e.g., `/pages/admin/users.tsx` for admin user management).

**User flow:**
1. Public routes: `/`, `/login`, `/signup`, `/demo-booking`.
2. Protected routes (requires login): `/dashboard`, `/practice`, `/feedback`, `/admin/*`.
3. We redirect users to `/login` if they try to access protected pages without a valid session.

## 7. Performance Optimization

**Key strategies:**
- **Code splitting**: Next.js automatically splits code by page. We also use dynamic imports for large components (e.g., voice-recording component).
- **Lazy loading**: Images and non-critical components load only when they’re about to appear on screen.
- **Asset optimization**: We use Next.js Image component for optimized image delivery and automatic resizing.
- **Caching**: SWR caches server data and updates it in the background, reducing repeated network requests.

These optimizations lower page load times and keep interactions snappy, especially for real-time voice streaming.

## 8. Testing and Quality Assurance

**Testing levels:**
1. **Unit tests** for components and utility functions.
2. **Integration tests** for pages and data fetching.
3. **End-to-end (E2E) tests** for key user flows (e.g., signing up, starting a practice session).

**Tools:**
- **Jest + React Testing Library** for unit and integration tests.
- **Cypress** for E2E tests simulating real user actions.
- **ESLint** and **Prettier** enforce code style and catch errors before merging.

**Process:**
- Pull requests run our test suite and lint checks in Vercel CI/CD.
- No code is merged unless all tests pass and no lint errors remain.

## 9. Conclusion and Overall Frontend Summary

Our frontend uses Next.js with TypeScript and Tailwind CSS to build a modern, responsive, and accessible platform. By splitting the UI into clear components, managing state with Context and SWR, and optimizing performance with code splitting and lazy loading, we ensure a fast and maintainable codebase. Testing at every level—unit, integration, and E2E—keeps our code reliable. 

This setup meets our goals for scalability, security (GDPR-friendly), and a smooth user experience from landing page to real-time voice practice and feedback.