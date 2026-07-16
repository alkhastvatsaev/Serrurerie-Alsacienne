# Locksmith Operations Dashboard

A mobile-first operations prototype for a Belgian locksmith team. It brings dispatch, field work, customer records, inventory and reporting into one interface for administrators and technicians.

**Live demo:** [serrure.vercel.app](https://serrure.vercel.app)

The public deployment is a portfolio demonstration with sample business data. Use **Developer Access** on the sign-in screen to explore the admin workflow; no real customer account is required.

## Product and users

The product is designed around two roles:

- **Dispatch/admin staff** coordinate interventions, technicians, schedules, zones, customers and stock from a desktop dashboard.
- **Field technicians** use a responsive mission view to update work status, record parts, capture signatures and prepare intervention documents.

The project focuses on the operational handoff between the office and the field rather than a generic CRUD dashboard.

## Implemented features

- Role-specific admin and technician dashboards
- Intervention creation, assignment, status tracking and emergency prioritisation
- Interactive territory and intervention maps
- Customer CRM records with activity history
- Central and per-van inventory views
- Technician schedules, notifications and low-stock signals
- Rule-based technician suggestions based on zones, availability and stock
- Intervention pricing, PDF generation and CSV/JSON export utilities
- Photo upload, signature capture and client tracking simulations
- Optional Firebase real-time synchronisation and phone authentication
- Server routes for Stripe Checkout, Resend email, Google OAuth/Gmail, call transcription and a filtered Belgian news feed
- PWA manifest and responsive layouts

Some integrations deliberately fall back to sample or simulated data when credentials are absent. The demo therefore shows the complete interface without claiming that every third-party workflow is production-connected.

## Stack

- Next.js 16 App Router, React 19 and TypeScript
- Tailwind CSS 4, Radix UI and Framer Motion
- Zustand for client state and persistence
- Firebase Authentication, Firestore and Storage as optional hosted services
- Stripe, Resend, Google APIs and OpenAI integration routes
- Vitest, Testing Library, MSW and Playwright
- Vercel for the live deployment

## Architecture and data flow

1. `src/app` defines the UI entry point and server-side integration routes.
2. Admin and technician components read and update a typed Zustand store.
3. The store starts with sample operational data so the portfolio demo remains usable without cloud credentials.
4. When Firebase is configured, snapshot listeners hydrate operational collections and mutations are synchronised to Firestore or Storage.
5. Integration routes keep private provider credentials on the server and return small JSON responses to the client.
6. Domain utilities calculate pricing, geography and exports independently of the UI and are covered by unit tests.

## Security and current limitations

- No secrets are committed. Public Firebase browser configuration is separated from private server credentials.
- Repository Firestore rules deny every client request by default. A real deployment must introduce and test a role model before enabling collection access.
- The **Developer Access** control bypasses sign-in for demonstration purposes. It must be removed or gated before handling real users.
- Sample identities and operational records are demonstration fixtures, not a production dataset or verified customer data.
- Several integrations are prototypes: webhook routes do not yet verify provider signatures, generated client links are not cryptographically signed, and authorization is not consistently enforced by server-side sessions.
- The app is not presented as production-ready for customer, payment or call data until authentication, authorization, validation, audit logging and integration-specific security are completed.

## Local setup

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/alkhastvatsaev/Serrurerie-Alsacienne.git
cd Serrurerie-Alsacienne
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Environment variables are optional for the local demo. Add only the providers you intend to exercise; never commit `.env.local`.

### Environment variables

`.env.example` documents all variables referenced by the application:

- Firebase browser configuration (`NEXT_PUBLIC_FIREBASE_*`)
- `OPENAI_API_KEY`
- `RESEND_API_KEY` and `EMAIL_RECIPIENT`
- `STRIPE_SECRET_KEY`
- Google OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`)
- Optional `NEXT_PUBLIC_GEMINI_API_KEY`

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Unit and component tests cover pricing, geographic assignment, store behaviour, dispatch logic and dashboard interactions. Playwright scenarios are available separately with `npm run test:e2e`. GitHub Actions runs install, lint, type checking, tests and a credential-free production build on pushes and pull requests.

## Roadmap

- Replace demo access with server-verified authentication and role-based authorization
- Add tested least-privilege Firestore rules for the final identity model
- Validate API payloads, verify webhook signatures and add rate limiting
- Move sensitive business mutations behind authenticated server endpoints
- Replace remaining simulations with sandboxed provider integrations
- Add Firebase emulator integration tests and focused Playwright coverage
- Improve accessibility, loading states and operational error recovery
