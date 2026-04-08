import { NextRequest, NextResponse } from 'next/server'
import { streamGenerateInstructions } from '@/lib/instructions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    return new Response('DASHSCOPE_API_KEY not configured', {  status: 500 })
  }

  const { projectName, parts } = await req.json()
  if (!projectName || !parts?.length) {
    return new Response('projectName and parts are required', { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      await streamGenerateInstructions(projectName, parts, apiKey, (chunk) => {
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
