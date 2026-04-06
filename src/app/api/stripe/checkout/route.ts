import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-02-24.acacia',
})

const PRICE_IDS: Record<string, string> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY ?? 'price_monthly_placeholder',
  yearly: process.env.STRIPE_PRICE_YEARLY ?? 'price_yearly_placeholder',
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== process.env.INTERNAL_API_KEY && process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan, userId, userEmail } = await req.json()

  if (!plan || !['monthly', 'yearly'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const priceId = PRICE_IDS[plan]
  if (!priceId || priceId.includes('placeholder')) {
    return NextResponse.json({ error: 'Stripe price not configured' }, { status: 503 })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail,
      metadata: {
        userId: userId ?? '',
        plan,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/account?stripe=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/pricing?stripe=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[stripe checkout]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
