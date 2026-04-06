# MIC.BEST — Setup Guide

## Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase account (free tier OK)
- Stripe account (for payments)

---

## 1. Clone & Install

```bash
cd PROJECTS/active/mic-best
npm install
```

## 2. Supabase Setup

### 2.1 Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Note the **Project URL** and **anon/public key** from Settings → API

### 2.2 Run Schema
In Supabase SQL Editor, run `supabase/schema.sql` (or use `supabase cli push`)

Tables created:
- `public.profiles` — extends auth.users
- `public.projects` — user projects
- `public.community_projects` — public community board

### 2.3 Add to `.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 2.4 Enable Row Level Security
The schema.sql already includes RLS policies. Make sure they're active.

---

## 3. Stripe Setup

### 3.1 Get API Keys
- **Secret Key**: Stripe Dashboard → Developers → API keys → test mode
- **Webhook Secret**: after creating a webhook endpoint

### 3.2 Create Products/Prices
1. Stripe Dashboard → Products → Add Product
2. Create two prices:
   - **Monthly**: $9/month (¥49/month)
   - **Yearly**: $90/year (¥333/year)
3. Copy the **Price IDs**

### 3.3 Add to `.env.local`
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_xxx
STRIPE_PRICE_YEARLY=price_xxx
```

### 3.4 Webhook Endpoint
Create webhook in Stripe Dashboard → Webhooks:
- URL: `https://your-domain.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`

For local testing, use Stripe CLI:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 4. Start Dev Server

```bash
npm run dev
# → http://localhost:3000
```

---

## 5. Deploy (Vercel)

Set env vars in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_YEARLY`
- `INTERNAL_API_KEY`

---

## Current Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| AI BOM Generation | ✅ Working | Uses DashScope/通义 |
| Image Generation | ✅ Working | Uses DashScope V2 |
| Parts AI Search | ✅ Working | Via `/api/bom/stream` |
| Project Save/Load | ✅ Code Ready | Needs Supabase |
| Wiring Save | ✅ Code Ready | Needs Supabase |
| Stripe Payments | ✅ Code Ready | Needs Stripe keys |
| Community Board | ✅ Fallback | Uses mock data (Supabase optional) |

Until env vars are filled, the app works in **demo mode** with mock data.
