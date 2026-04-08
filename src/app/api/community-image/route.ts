import { NextRequest, NextResponse } from 'next/server'

const BAILIAN_BASE = 'https://dashscope.aliyuncs.com/api/v1'

// In-memory cache — in production this would be a DB
const imageCache: Record<string, string> = {}

export async function POST(req: NextRequest) {
  const { projectId, prompt } = await req.json()

  if (!projectId || !prompt) {
    return NextResponse.json({ error: 'projectId and prompt required' }, { status: 400 })
  }

  // Return cached if available
  if (imageCache[projectId]) {
    return NextResponse.json({ success: true, imageUrl: imageCache[projectId], cached: true })
  }

  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'DASHSCOPE_API_KEY not configured' }, { status: 500 })
  }

  const fullPrompt = `Professional hardware prototype: ${prompt}. Entire product shown in full view, centered, occupying approximately 70% of the frame. Neutral light gray background #D3D3D3 to #E8E8E8, clean and uniform with no gradient, no texture, no shadow cast on background. Product: dark PCB in near-black tones RGB[20-50], displayed as complete unit without close-up details. Soft even lighting, no harsh shadows, no reflections on background. Technical product photography style, photorealistic. Aspect ratio 16:10.

Negative prompt: white background, pure white, bright white, close-up view, cropped view, partial product, large macro detail, harsh shadows, hard edges, text, watermark, UI elements, gradients on background.`

  try {
    const response = await fetch(`${BAILIAN_BASE}/services/aigc/multimodal-generation/generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-image-2.0-pro',
        input: { messages: [{ role: 'user', content: [{ text: fullPrompt }] }] },
        parameters: {
          n: 1,
          size: '1024*640',
          prompt_extend: true,
          watermark: false,
          negative_prompt: 'lowres, bad anatomy, bad hands, text, error, cropped, worst quality, low quality',
        },
      }),
    })

    const data = await response.json()
    if (!response.ok || !data.output?.choices?.[0]?.message?.content?.[0]?.image) {
      return NextResponse.json({ error: 'Image generation failed', detail: data }, { status: 500 })
    }

    const imageUrl = data.output.choices[0].message.content[0].image
    imageCache[projectId] = imageUrl

    return NextResponse.json({ success: true, imageUrl, cached: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
