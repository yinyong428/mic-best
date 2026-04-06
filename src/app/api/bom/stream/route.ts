import { NextRequest } from 'next/server'
import { streamGenerateBOM } from '@/lib/bailian'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    return new Response('BAILLIAN_API_KEY not configured', { status: 500 })
  }

  const { description } = await req.json()
  if (!description?.trim()) {
    return new Response('Description is required', { status: 400 })
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
