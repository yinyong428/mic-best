import { NextRequest, NextResponse } from 'next/server'
import { streamGenerateBOM, streamModifyBOM, type BOMContext } from '@/lib/bailian'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    return new Response('DASHSCOPE_API_KEY not configured', { status: 500 })
  }

  const body = await req.json()
  const { description, instruction, mode = 'generate', context } = body

  if (mode === 'modify') {
    if (!instruction?.trim()) {
      return new Response('instruction is required for modify mode', { status: 400 })
    }
    const ctx: BOMContext = context ?? {}
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        await streamModifyBOM(instruction, apiKey, ctx, (chunk) => {
          const data = `data: ${JSON.stringify(chunk)}\n\n`
          controller.enqueue(encoder.encode(data))
        })
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      },
    })
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }

  // Default: generate mode
  if (!description?.trim()) {
    return new Response('description is required', { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      await streamGenerateBOM(description, apiKey, (chunk) => {
        const data = `data: ${JSON.stringify(chunk)}\n\n`
        controller.enqueue(encoder.encode(data))
      })
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
