import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.startsWith('sk_test_your')) return null
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' })
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  const stripe = getStripe()
  if (!stripe) {
    console.warn('[stripe webhook] STRIPE_SECRET_KEY not configured')
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('[stripe webhook] signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId

        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end

          const supabase = createServerClient()
          if (supabase) {
            const { error } = await supabase
              .from('profiles')
              .update({ plan: 'pro' })
              .eq('id', userId)
            if (error) console.error('[stripe webhook] profile update error:', error)
          }
          console.log(`[stripe webhook] User ${userId} upgraded to PRO, renews at ${periodEnd}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const supabase = createServerClient()
        if (supabase) {
          const { error } = await supabase
            .from('profiles')
            .update({ plan: 'free' })
            .eq('id', subscription.metadata?.userId ?? '')
          if (error) console.error('[stripe webhook] downgrade error:', error)
        }
        break
      }

      case 'invoice.payment_failed': {
        console.warn('[stripe webhook] Payment failed for subscription:', event.data.object)
        break
      }

      default:
        console.log(`[stripe webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error('[stripe webhook] handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
