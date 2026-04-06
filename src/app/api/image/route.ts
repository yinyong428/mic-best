import { NextRequest, NextResponse } from 'next/server'

const BAILIAN_BASE = 'https://dashscope.aliyuncs.com/api/v1'

/**
 * Image generation using Bailian qwen-image-2.0-pro model.
 */
export async function POST(req: NextRequest) {
  const { prompt, projectName } = await req.json()

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  }

  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'DASHSCOPE_API_KEY not configured' }, { status: 500 })
  }

  const fullPrompt = `Professional hardware prototype: ${projectName ?? ''}. ${prompt}. Clean white background, technical product photography, photorealistic, sharp focus.`

  try {
    const response = await fetch(`${BAILIAN_BASE}/services/aigc/multimodal-generation/generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-image-2.0-pro',
        input: {
          messages: [
            {
              role: 'user',
              content: [{ text: fullPrompt }],
            },
          ],
        },
        parameters: {
          n: 1,
          size: '1024*1024',
          prompt_extend: true,
          watermark: false,
          negative_prompt: 'lowres, bad anatomy, bad hands, text, error, cropped, worst quality, low quality',
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[image API] bailian error:', data)
      return NextResponse.json(
        { error: data.message ?? `API error ${response.status}`, code: data.code },
        { status: response.status }
      )
    }

    const imageUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image

    if (!imageUrl) {
      console.error('[image API] no image in response:', JSON.stringify(data))
      return NextResponse.json({ error: 'No image returned', detail: data }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      source: 'bailian',
      requestId: data.request_id,
      width: data.usage?.width,
      height: data.usage?.height,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[image API] exception:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
