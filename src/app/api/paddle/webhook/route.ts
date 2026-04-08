import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Paddle webhook secret (from Paddle Dashboard → Developer Tools → Webhooks)
const WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET ?? ''

function verifyPaddleSignature(rawBody: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return true // Skip in dev
  try {
    const crypto = require('crypto')
    const expected = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex')
    return signature === expected
  } catch {
    return false
  }
}

// Credit pack mapping — must match NEXT_PUBLIC_PADDLE_PRICE_CREDITS_*
const CREDIT_PACKS: Record<string, number> = {
  'pri_credits_10': 10,
  'pri_credits_50': 50,
  'pri_credits_100': 100,
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('paddle-signature') ?? ''

  if (!verifyPaddleSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = event.event_type ?? event.type
  console.log('[Paddle Webhook]', eventType, JSON.stringify(event.data?.id ?? ''))

  try {
    switch (eventType) {
      // ── Subscription events ──────────────────────────────────────
      case 'subscription.created':
      case 'subscription.activated': {
        const sub = event.data
        const userId = sub.custom_data?.user_id
        if (userId) {
          const supabase = createServerClient()
          if (supabase) {
            await supabase
              .from('profiles')
              .update({ plan: 'pro' })
              .eq('id', userId)
            console.log(`[Paddle] User ${userId} upgraded to PRO`)
          }
        }
        break
      }

      case 'subscription.canceled':
      case 'subscription.past_due':
      case 'subscription.paused': {
        const sub = event.data
        const userId = sub.custom_data?.user_id
        if (userId && eventType === 'subscription.canceled') {
          const supabase = createServerClient()
          if (supabase) {
            await supabase
              .from('profiles')
              .update({ plan: 'free' })
              .eq('id', userId)
            console.log(`[Paddle] User ${userId} downgraded to FREE`)
          }
        }
        break
      }

      // ── One-time transaction (credits purchase) ────────────────────
      case 'transaction.completed': {
        const tx = event.data
        const userId = tx.custom_data?.user_id
        const creditsAmount = tx.custom_data?.credits_amount

        if (userId && creditsAmount) {
          const supabase = createServerClient()
          if (supabase) {
            // Add credits to user's profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('credits')
              .eq('id', userId)
              .single()

            const currentCredits = profile?.credits ?? 0
            const newCredits = currentCredits + Number(creditsAmount)

            await supabase
              .from('profiles')
              .update({ credits: newCredits })
              .eq('id', userId)

            console.log(
              `[Paddle] Added ${creditsAmount} credits to user ${userId} (total: ${newCredits})`
            )
          }
        } else if (userId && !creditsAmount) {
          // Fallback: detect by price ID
          const items = tx.items ?? []
          for (const item of items) {
            const credits = CREDIT_PACKS[item.priceId]
            if (credits) {
              const supabase = createServerClient()
              if (supabase) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('credits')
                  .eq('id', userId)
                  .single()

                const newCredits = (profile?.credits ?? 0) + credits
                await supabase
                  .from('profiles')
                  .update({ credits: newCredits })
                  .eq('id', userId)
                console.log(`[Paddle] Added ${credits} credits to user ${userId}`)
              }
              break
            }
          }
        }
        break
      }

      default:
        console.log(`[Paddle Webhook] Unhandled event: ${eventType}`)
    }
  } catch (err) {
    console.error('[Paddle Webhook] Handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
