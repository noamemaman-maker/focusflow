# 🚀 FocusFlow – Productivity Timer SaaS (Next.js 14+)

FocusFlow is a full-featured **productivity web application** built using the modern Next.js 14 App Router architecture. It provides a beautifully designed **Pomodoro timer**, detailed **session analytics**, **premium focus modes**, **AI-powered insights**, and a complete **subscription system** powered by Stripe.

This project is built as a real SaaS product with authentication, premium gating, database logging, AI integrations, and a polished mobile-first UI.

---

## 🧱 Tech Stack

| Layer        | Technology |
|--------------|------------|
| **Frontend** | Next.js 14+ (App Router), TypeScript, TailwindCSS, shadcn/ui |
| **Backend**  | Next.js Server Components + API Routes |
| **Database** | Supabase (PostgreSQL + Row Level Security) |
| **Auth**     | Supabase Auth (Email/Password) |
| **Payments** | Stripe Subscriptions + Billing Portal |
| **AI**       | OpenAI (GPT-4o / GPT-4o-mini) |
| **Charts**   | Recharts |

All pages and components are **mobile-first**, responsive, and styled using the shadcn/ui component system.

---

# 🎯 Core Features Overview

FocusFlow provides a full suite of productivity tools with free functionality for all users and additional premium features unlocked through a Stripe subscription.

Premium unlocks automatically when:
profile.is_premium = true

---

# 🌟 FREE FEATURES

## ⏱️ Pomodoro Timer

A fully functional Pomodoro timer with:

- 25-minute work session  
- 5-minute break  
- 15-minute long break  
- Start / Pause / Reset controls  
- Timer state saved in `localStorage`  
- Optimized for mobile users  
- Clean, centered interface using shadcn/ui

---

## 📝 Session Logging

Every completed session is logged to Supabase:

| Field              | Description |
|-------------------|-------------|
| `user_id`          | Authenticated user |
| `session_type`     | work / short_break / long_break |
| `mode`             | pomodoro / deep / 52-17 / ultradian |
| `start_time`       | Timestamp |
| `end_time`         | Timestamp |
| `duration_seconds` | Integer |
| `created_at`       | Timestamp |

Row-Level Security ensures users can only access their own data.

---

## 📊 Basic Stats

Free users receive:

- Total work minutes today  
- Completed cycles today  
- **Last 7 sessions only** (limited history for free tier)

---

## 🔐 Authentication

Provided by Supabase Auth:

- Email/password registration  
- Login form  
- Protected pages  
- `/settings` page for account information  

---

# 💎 PREMIUM FEATURES (PAYWALLED)

Premium content becomes accessible when:
profile.is_premium = true


If a non-premium user attempts to access a premium feature, a shadcn/ui modal prompts them to upgrade via Stripe Checkout.

---

## 🔥 1. Advanced Focus Modes

Premium users unlock three scientifically-based deep focus modes:

| Mode            | Work | Break | Tier |
|----------------|-------|--------|------|
| Pomodoro       | 25    | 5      | Free |
| **Deep Work**  | 50    | 10     | Premium |
| **52 / 17**    | 52    | 17     | Premium |
| **Ultradian**  | 90    | 20     | Premium |

Selecting a premium mode as a free user triggers an upgrade modal.

---

## 📈 2. Premium Productivity Dashboard

Route: `/dashboard`

The dashboard includes:

- Total work minutes today  
- Weekly work minutes  
- Break time totals  
- Completed cycles summary  
- **Focus Score**  
focus_score = (work_minutes / (work_minutes + break_minutes)) * 100

- Weekly charts:
- Line/Bar chart (work minutes per day)
- Donut chart (work vs break ratio)
- Productivity streak counter  
- Unlimited history (free tier limited to 7 days)

Free users see blurred content + upgrade prompts.

---

## 🤖 3. AI Productivity Insights

Route: `/insights` (premium-only)

### Workflow

1. User clicks **“Generate My AI Productivity Insight”**
2. App fetches last 7 days of session data from Supabase
3. Sends structured JSON summary to OpenAI (GPT-4o or GPT-4o-mini)
4. AI returns a Markdown report:


Optionally, insights are stored in the `ai_insights` table.

---

# 💳 Stripe Subscription System

Full subscription and billing flow implemented via Stripe.

### Checkout Session

- User clicks **Upgrade**
- App calls:  
  `/api/stripe/create-checkout-session`
- Redirects to Stripe Checkout
- On successful payment, Stripe Webhook sets:  
profile.is_premium = true


### Billing Portal

- `/api/stripe/create-portal-session`  
- Users can cancel or update their subscription

### UI

- Navbar shows **PREMIUM** badge  
- Locked content shows upgrade prompts  

---

# 🗄️ Database Schema (Supabase)

### `profiles`
id uuid PRIMARY KEY
email text
is_premium boolean DEFAULT false
stripe_customer_id text
stripe_subscription_id text
created_at timestamp


### `sessions`
Logs focus and break sessions.

### `ai_insights`
Stores AI-generated productivity summaries.

All tables include **RLS policies** restricting access to authenticated users.

---

# ⏱️ Timer Logic

Timer component includes:

- `mode` → pomodoro / deep / 52-17 / ultradian  
- `secondsLeft`  
- `running`  
- `currentSessionType` → work / break  

### Behavior

- Work completes → logs session → transitions to break  
- Break completes → transitions to work  
- Changing the mode resets the timer  

---

# 🎨 UI & UX (shadcn/ui)

Uses shadcn/ui components for:

- Navbar  
- Buttons  
- Cards  
- Modals  
- Tabs / Segmented Switchers  
- Inputs  

Charts rendered with **Recharts**.

### App Pages
/ Landing page
/timer Main productivity timer
/dashboard Premium analytics dashboard
/insights AI productivity insights
/history Session history
/auth/login
/auth/register
/settings Account settings
/billing Manage subscription


All screens are mobile-first and responsive.

---

# ⚙️ Environment Variables

Create `.env.local`:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000


---

# 🚀 Running Locally

Install dependencies:

```bash
npm install

"""
Start the development server:

```bash
npm run dev
"""

## 📦 Deployment

**Recommended Platform:** Vercel

- Zero-config for Next.js 14+
- Automatic routing
- Easy environment variable management
- Works seamlessly with Supabase + Stripe
- Ensure production environment variables match those in `.env.local`.

---

## 🧭 Project Status

FocusFlow includes:

- ✔️ Timer + session logging  
- ✔️ Premium focus modes  
- ✔️ Premium dashboard  
- ✔️ AI productivity insights  
- ✔️ Stripe subscription system  
- ✔️ Supabase profile & RLS  
- ✔️ Mobile-first interface  
- ✔️ Clean component architecture (shadcn/ui)  

**Result:** A fully functional, production-ready SaaS productivity application.




