# LeadForge CRM

A production-ready B2B CRM for SMBs and growing sales teams. Built with Next.js 15, Supabase, Stripe, and full English/Spanish i18n.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Payments | Stripe |
| Email | Resend |
| i18n | next-intl |
| Forms | React Hook Form + Zod |
| AI | OpenAI GPT-4o-mini |
| Testing | Vitest + Playwright |

---

## Features

### CRM Modules
- **Leads** — Capture, score, qualify, and convert leads to contacts/companies/opportunities
- **Contacts** — Full contact management with activity history and linked opportunities
- **Companies** — Account-level tracking with associated contacts and deals
- **Opportunities** — Kanban + table pipeline view with configurable stages
- **Activities** — Log calls, meetings, emails, demos, and notes
- **Tasks** — Task management with priorities, due dates, and overdue tracking
- **Quotes** — Professional quotes with line items, tax, PDF export
- **Reports** — Pipeline analytics, forecast, lead sources, activity by rep

### Platform
- **Multi-tenant** — Complete organization isolation, users in multiple orgs
- **RBAC** — Org Admin, Sales Manager, Sales Rep, Viewer roles
- **Billing** — Stripe Checkout, Customer Portal, plan limits, usage gating
- **i18n** — Full English + Spanish, locale routing, persistent preference
- **AI** — Opportunity summary, next step suggestion, follow-up email draft
- **Audit Logs** — All critical actions tracked per organization
- **Analytics** — Event tracking for key sales and product actions
- **Emails** — Welcome, invite, password reset, trial ending (EN + ES)

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (free tier works)
- Stripe account (test mode)
- Resend account

### 1. Clone and install

```bash
git clone https://github.com/your-org/leadforge-crm.git
cd leadforge-crm
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
STRIPE_GROWTH_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...

RESEND_API_KEY=re_...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Dependencies note

- **`@supabase/ssr`** must be a recent release (e.g. `^0.10`) so `createServerClient<Database>()` matches current `@supabase/supabase-js` typings. Older `0.3.x` can collapse schema types to `never` and break `tsc`.
- **`types/supabase.ts`** defines `TableInsert` / `TableInsertShort` and `Relationships` so embeds like `organizations(*)` and `profiles!…_fkey` type-check. Regenerate from Supabase CLI when the schema changes and preserve those patterns.

### Auth redirect URLs (Supabase)

In the Supabase dashboard → Authentication → URL configuration, add:

- `http://localhost:3000/auth/callback` (and your production URL + `/auth/callback`)

Password reset emails use this route to exchange the code for a session before sending users to `/{locale}/update-password`.

### 3. Database setup

Install Supabase CLI and link your project:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
```

Run migrations:

```bash
npm run db:migrate
# or manually:
npx supabase db push
```

### 4. Seed demo data

```bash
npm run db:seed
```

This creates:
- 1 demo organization: **Demo Sales Corp**
- 5 demo users (see credentials below)
- 6 pipeline stages
- 20 companies, 35 contacts, 50 leads
- 18 opportunities, 25 tasks, 8 quotes
- Activities and audit logs

**Demo login credentials** (password: `Demo1234!`):
| Role | Email |
|------|-------|
| Org Admin | admin@demo.leadforge.io |
| Sales Manager | manager@demo.leadforge.io |
| Sales Rep | rep1@demo.leadforge.io |
| Sales Rep | rep2@demo.leadforge.io |
| Viewer | viewer@demo.leadforge.io |

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
/
├── app/
│   ├── [locale]/
│   │   ├── (marketing)/        # Public marketing pages
│   │   ├── (auth)/             # Login, signup, reset password
│   │   └── (app)/              # Protected app routes
│   │       ├── dashboard/
│   │       ├── leads/
│   │       ├── contacts/
│   │       ├── companies/
│   │       ├── opportunities/
│   │       ├── tasks/
│   │       ├── activities/
│   │       ├── quotes/
│   │       ├── reports/
│   │       ├── team/
│   │       ├── settings/
│   │       └── billing/
│   └── api/
│       ├── webhooks/stripe/    # Stripe webhook handler
│       ├── analytics/          # Event tracking endpoint
│       ├── billing/            # Checkout + portal sessions
│       └── ai/                 # AI features endpoint
│
├── components/
│   ├── ui/                     # Base UI primitives
│   ├── shared/                 # Reusable cross-feature components
│   ├── app-shell/              # Sidebar, topbar
│   ├── marketing/              # Marketing-specific components
│   ├── forms/                  # Form components
│   ├── tables/                 # Data table components
│   ├── charts/                 # Chart components
│   └── empty-states/           # Empty state components
│
├── features/
│   ├── leads/                  # Lead management
│   ├── contacts/               # Contact + company management
│   ├── opportunities/          # Opportunity/pipeline management
│   ├── tasks/                  # Tasks + activities
│   ├── quotes/                 # Quote generation
│   ├── reports/                # Analytics and reporting
│   ├── billing/                # Billing integration
│   ├── organizations/          # Org management
│   ├── analytics/              # Dashboard stats
│   └── audit-log/              # Audit logging
│
├── lib/
│   ├── auth/                   # Auth helpers (server + middleware)
│   ├── db/                     # Supabase clients (server + browser)
│   ├── i18n/                   # next-intl config and request handler
│   ├── rbac/                   # Permission definitions and helpers
│   ├── stripe/                 # Stripe client and helpers
│   ├── resend/                 # Email templates
│   ├── analytics/              # Event tracking
│   ├── audit/                  # Audit log helpers
│   ├── validators/             # Zod schemas for all entities
│   ├── utils/                  # General utilities
│   └── dates/                  # Date formatting helpers
│
├── messages/
│   ├── en/                     # English translations (namespaced)
│   └── es/                     # Spanish translations (namespaced)
│
├── supabase/
│   ├── migrations/             # SQL migration files
│   └── seed/                   # Demo data seed script
│
├── types/
│   ├── supabase.ts             # Generated database types
│   └── index.ts                # Shared domain types
│
├── hooks/                      # React hooks
├── tests/
│   ├── e2e/                    # Playwright E2E tests
│   ├── unit/                   # Vitest unit tests
│   └── setup.ts                # Test environment setup
│
├── middleware.ts               # i18n + auth middleware
├── next.config.ts
├── tailwind.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── .env.example
```

---

## Running Tests

### Unit tests

```bash
npm test
# With coverage
npm run test:coverage
```

### E2E tests

Make sure the app is running (`npm run dev`), then:

```bash
npm run test:e2e
# With UI
npx playwright test --ui
```

---

## i18n Architecture

- **Locale routing**: `/en/...` and `/es/...` via `next-intl` middleware
- **Message files**: Namespaced JSON files in `messages/en/` and `messages/es/`
- **Namespaces**: `common`, `auth`, `dashboard`, `leads`, `contacts`, `companies`, `opportunities`, `tasks`, `activities`, `quotes`, `reports`, `billing`, `team`, `settings`, `marketing`, `legal`
- **Interpolation**: Supported via ICU message format (`{name}`, `{count}`, `{days, plural, ...}`)
- **Locale persistence**: Language preference stored via URL path and can be extended to cookies/user profile
- **Default locale**: English (`en`)

To add a new language:
1. Add locale to `lib/i18n/config.ts`
2. Create message files in `messages/[locale]/`
3. Update middleware matcher

---

## Multi-Tenancy & Security

- Every database table with tenant data includes `organization_id`
- **Row Level Security (RLS)** enforced at the database level via Supabase policies
- All queries are filtered by `organization_id` in server actions
- RBAC enforced in both server actions (`requirePermission`) and UI (conditional rendering)
- Users can belong to multiple organizations and switch between them
- Organization context resolved on every request from active membership

---

## Billing & Plans

| Feature | Starter ($29/mo) | Growth ($79/mo) | Pro ($149/mo) |
|---------|---------|--------|-----|
| Users | 3 | 10 | Unlimited |
| Leads | 500 | 5,000 | Unlimited |
| Quotes/month | 10 | 100 | Unlimited |
| Reports | ✗ | ✓ | ✓ |
| AI Features | ✗ | ✓ | ✓ |
| Custom Fields | ✗ | ✗ | ✓ |
| API Access | ✗ | ✗ | ✓ |

Stripe webhook events handled:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

---

## Deployment

### Vercel (recommended)

```bash
npm install -g vercel
vercel --prod
```

Set all environment variables in Vercel dashboard.

### Stripe Webhook

Register your webhook endpoint in the Stripe Dashboard:
- URL: `https://your-domain.com/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`

### Supabase

For production, enable:
- Email confirmation in Auth settings
- SMTP provider for auth emails
- Connection pooling (PgBouncer) for high traffic

---

## Known Limitations

- **PDF generation**: Quote PDFs use `@react-pdf/renderer` with a simple layout. Heavy branding or complex layouts may need a dedicated document service.
- **Real-time collaboration**: Pipeline and lists do not sync live across browsers; add Supabase Realtime if you need it.
- **Plan feature matrix**: Plan limits are enforced in usage displays and intended hooks; extend server actions with limit checks where your product requires hard stops.
- **Multi-currency display**: Organization currency is stored; FX conversion is not applied.

---

## Architecture Decisions

- **Server Actions over API Routes** for CRUD operations — better DX, co-located with features, automatic revalidation
- **next-intl** for i18n — production-proven, supports App Router, RSC-compatible
- **Supabase RLS** as the primary security layer — defense in depth beyond application-level checks
- **Feature-based folder structure** — each domain owns its components, actions, schemas, and types
- **No ORM** — direct Supabase client queries for simplicity and type safety with generated types

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Run tests: `npm test`
4. Submit a PR

---

## License

MIT License — see LICENSE file for details.
