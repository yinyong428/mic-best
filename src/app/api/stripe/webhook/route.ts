import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-02-24.acacia',
})
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

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
        const plan = session.metadata?.plan ?? 'monthly'

        if (userId && session.subscription) {
          // Fetch subscription to get current period end
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end

          // Update user plan in Supabase
          const supabase = createServerClient()
          const { error } = await supabase
            .from('profiles')
            .update({
              plan: 'pro',
              // Could also store stripe_subscription_id, stripe_customer_id, etc.
            })
            .eq('id', userId)

          if (error) console.error('[stripe webhook] profile update error:', error)
          console.log(`[stripe webhook] User ${userId} upgraded to PRO, renews at ${periodEnd}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        // Find user by stripe customer id and downgrade
        const supabase = createServerClient()
        const { error } = await supabase
          .from('profiles')
          .update({ plan: 'free' })
          .eq('id', subscription.metadata?.userId ?? '')

        if (error) console.error('[stripe webhook] downgrade error:', error)
        break
      }

      case 'invoice.payment_failed': {
        // Could notify user, log, or auto-downgrade after grace period
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
