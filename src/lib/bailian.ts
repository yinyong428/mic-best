/**
 * Bailian (百炼) Streaming API client
 * Three phases: thinking → parsing → done
 */

const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

export interface BOMItem {
  name: string
  quantity: number
  description: string
  category: string
  unitCost: number
  supplier: string
  partNumber: string
  lcscId?: string
  hqPartNumber?: string
}

export interface BOMResult {
  projectName: string
  description: string
  totalCost: number
  items: BOMItem[]
  suggestedParts: string[]
  reasoning: string
}

export type ChunkPhase = 'thinking' | 'parsing' | 'done' | 'error'

export interface StreamingChunk {
  phase: ChunkPhase
  thinking?: string   // design rationale text
  progress?: string   // e.g. "正在解析 BOM...", "已找到 7 个元件"
  result?: BOMResult
  error?: string
}

const SYSTEM_PROMPT = `你是一个硬件原型设计专家，擅长根据项目描述生成精确的物料清单（BOM）。

当用户描述一个硬件项目时，先用中文写2-3句话说明设计思路，然后返回JSON格式的完整BOM。

设计思路示例：选用ESP32是因为它自带WiFi便于联网，DHT22精度足够且价格便宜，OLED用于本地显示关键数据。

BOM的JSON格式（不要有markdown代码块，直接返回JSON对象）：
{
  "projectName": "项目名称",
  "description": "项目简介",
  "totalCost": 数字,
  "items": [
    {
      "name": "元件名称",
      "quantity": 数字,
      "description": "规格描述",
      "category": "MCU/传感器/电源/外壳/连接器/其他",
      "unitCost": 数字,
      "supplier": "LCSC/淘宝/京东/华强北/德捷",
      "partNumber": "常见型号",
      "lcscId": "立创商城零件编号（如C12345，可为空字符串）",
      "hqPartNumber": "华强北零件编号（如有，可为空字符串）"
    }
  ],
  "suggestedParts": ["关键元件"],
  "reasoning": "设计思路（与前面的设计思路文字保持一致）"
}

重要要求：
1. 每个元件必须尽量填写 lcscId（立创商城零件编号），格式如 C2905875，可在 https://www.lcsc.com/search 查询
2. 华强北零件编号（hqPartNumber）可填写，方便在华强北批发采购
3. 价格统一填写人民币单价（元）
4. 优先选择有 lcscId 的零件，便于直接采购`

export async function streamGenerateBOM(
  description: string,
  apiKey: string,
  onChunk: (chunk: StreamingChunk) => void
): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-max-latest',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: description },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2500,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      onChunk({ phase: 'error', error: `API ${response.status}: ${error}` })
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      onChunk({ phase: 'error', error: 'No response body' })
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let fullText = ''
    let thinkingDone = false
    let doneEmitted = false

    while (true) {
      const { done: readerDone, value } = await reader.read()
      if (readerDone) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const token: string = parsed.choices?.[0]?.delta?.content ?? ''
          if (!token) continue

          fullText += token

          if (!thinkingDone) {
            // Strip any JSON-opening brace from the thinking text to avoid garbled display
            const cleanToken = token.replace(/\{$/, '')
            if (cleanToken) {
              onChunk({ phase: 'thinking', thinking: cleanToken })
            }
            //检测是否出现JSON
            const jsonStart = fullText.indexOf('{')
            if (jsonStart !== -1) {
              thinkingDone = true
              onChunk({ phase: 'parsing', progress: '正在解析 BOM…' })
            }
          }
        } catch {
          // Skip malformed
        }
      }
    }

    // Parse final JSON
    if (fullText) {
      try {
        const jsonStart = fullText.indexOf('{')
        const jsonEnd = fullText.lastIndexOf('}')
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonStr = fullText.slice(jsonStart, jsonEnd + 1)
          const result = JSON.parse(jsonStr) as BOMResult
          const itemCount = result.items?.length ?? 0
          if (!doneEmitted) {
            doneEmitted = true
            onChunk({
              phase: 'done',
              progress: `已生成 ${itemCount} 个元件，总成本 ¥${result.totalCost}`,
              result,
            })
          }
        }
      } catch {
        onChunk({ phase: 'error', error: '解析 BOM 失败，请重试' })
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    onChunk({ phase: 'error', error: message })
  }
}
