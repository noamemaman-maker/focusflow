# FocusFlow - Productivity Timer SaaS

## Overview
FocusFlow is a full-featured productivity SaaS application built with Next.js 14+, featuring:
- Pomodoro-style timer with multiple focus modes
- Premium subscription via Stripe
- AI-powered productivity insights via OpenAI
- Supabase for authentication and database

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), TypeScript, TailwindCSS, shadcn/ui components
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Payments**: Stripe Checkout & Subscriptions
- **AI**: OpenAI GPT-4o-mini

## Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (protected)/        # Protected routes requiring auth
│   │   ├── timer/          # Main timer page
│   │   ├── dashboard/      # Premium analytics dashboard
│   │   ├── insights/       # AI productivity insights
│   │   ├── history/        # Session history
│   │   ├── settings/       # Account settings
│   │   └── billing/        # Subscription management
│   ├── auth/               # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   └── callback/
│   └── api/                # API routes
│       ├── stripe/         # Stripe checkout & webhooks
│       └── ai/             # AI insights generation
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── Timer.tsx           # Main timer component
│   ├── Navbar.tsx          # Navigation bar
│   ├── PremiumGate.tsx     # Premium feature gating
│   └── UpgradeModal.tsx    # Upgrade prompt modal
├── lib/                    # Utility functions
│   ├── supabase/           # Supabase client configuration
│   └── utils.ts            # Helper functions
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript type definitions
```

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=your_app_url
```

## Database Schema (Supabase)
Required tables:
1. **profiles** - User profiles with premium status
2. **sessions** - Focus session logs
3. **ai_insights** - Generated AI insights

## Features
### Free Features
- Pomodoro Timer (25/5/15)
- Session logging
- Basic stats (last 7 sessions)
- Email authentication

### Premium Features ($9.99/month)
- Deep Work Mode (50/10)
- 52/17 Focus Mode
- Ultradian Cycle (90/20)
- Advanced Analytics Dashboard
- AI Productivity Insights
- Unlimited Session History
- Productivity Streak Tracking

## Running the App
```bash
npm run dev
```
The app runs on port 5000.

## Recent Changes
- Initial project setup with Next.js 14+
- Implemented timer with 4 focus modes
- Created premium subscription flow with Stripe
- Added AI insights using OpenAI
- Built responsive UI with shadcn/ui components
