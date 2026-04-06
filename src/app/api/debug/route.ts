import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.DASHSCOPE_API_KEY ?? 'MISSING'
  const masked = key.slice(0, 8) + '...' + key.slice(-4)

  // Test with curl-equivalent call
  let bailianOk = false
  let bailianError = ''
  try {
    const res = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'qwen-image-2.0-pro',
        input: { messages: [{ role: 'user', content: [{ text: 'test' }] }] },
        parameters: { n: 1, size: '1024*1024' },
      }),
    })
    bailianOk = res.ok
    bailianError = await res.text()
  } catch (e: any) {
    bailianError = e.message
  }

  return NextResponse.json({
    key: masked,
    bailianOk,
    bailianError: bailianOk ? 'OK' : bailianError.slice(0, 200),
  })
}
