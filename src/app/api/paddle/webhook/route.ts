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
    return true
  }
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

  console.log('[Paddle Webhook]', event.event_type ?? event.type, JSON.stringify(event.data?.id ?? ''))

  try {
    switch (event.event_type ?? event.type) {
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
            console.log(`[Paddle] User ${userId} upgraded to PRO (subscription: ${sub.id})`)
          }
        }
        break
      }

      case 'subscription.canceled':
      case 'subscription.past_due':
      case 'subscription.paused': {
        const sub = event.data
        const userId = sub.custom_data?.user_id

        if (userId) {
          const supabase = createServerClient()
          if (supabase && event.event_type === 'subscription.canceled') {
            await supabase
              .from('profiles')
              .update({ plan: 'free' })
              .eq('id', userId)
            console.log(`[Paddle] User ${userId} downgraded to FREE (cancelled)`)
          }
        }
        break
      }

      case 'transaction.completed': {
        const tx = event.data
        console.log(`[Paddle] Transaction completed: ${tx.id}, amount: ${tx.amount}`)
        break
      }

      default:
        console.log(`[Paddle Webhook] Unhandled event: ${event.event_type ?? event.type}`)
    }
  } catch (err) {
    console.error('[Paddle Webhook] Handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
