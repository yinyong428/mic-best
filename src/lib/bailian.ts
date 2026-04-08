/**
 * Bailian (百炼) Streaming API client
 * Supports two modes:
 *   - generate: fresh BOM from project description
 *   - modify:  update existing BOM based on natural language instruction
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
  thinking?: string
  progress?: string
  result?: BOMResult
  error?: string
}

export type BOMMode = 'generate' | 'modify'

export interface BOMContext {
  projectName?: string
  currentParts?: BOMItem[]
  history?: { role: 'user' | 'assistant'; content: string }[]
}

// ─── System prompts ────────────────────────────────────────────────────────────

const SYSTEM_GENERATE = `你是一个硬件原型设计专家，擅长根据项目描述生成精确的物料清单（BOM）。

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
      "category": "mcu/sensor/actuator/power/module/structural/enclosure/misc",
      "unitCost": 数字（人民币元）,
      "supplier": "LCSC/淘宝/京东/华强北/德捷",
      "partNumber": "常见型号",
      "lcscId": "立创商城零件编号（如C2905875）",
      "hqPartNumber": "华强北零件编号（可为空）"
    }
  ],
  "suggestedParts": ["关键元件名"],
  "reasoning": "设计思路（与前面的设计思路文字保持一致）"
}

重要：
1. 每个元件必须尽量填写 lcscId（立创商城零件编号），格式如 C2905875
2. 价格统一填写人民币单价（元）
3. category 只能使用以下值之一：mcu, sensor, actuator, power, module, structural, enclosure, misc
4. 优先选择有 lcscId 的零件`

const SYSTEM_MODIFY = `你是一个硬件 BOM 专家，擅长根据用户的自然语言指令修改现有物料清单。

用户会给你：
1. 当前项目的已有元件清单（currentParts）
2. 用户的修改指令（instruction）

你必须理解指令类型并执行正确的修改：

支持的指令类型：
- "加/添加 + 元件名" → 在清单中加入新元件
- "替换/把X换成Y" → 将匹配的元件替换为新元件
- "删除/移除 X" → 从清单中删除指定元件
- "修改数量/把X数量改成Y" → 更新元件数量
- "换一个方案/换一种设计" → 重新生成完整 BOM（替换整个 items 数组）

修改后返回完整的新 BOM JSON（不是只返回变化的部分，是整个新的 items 数组）：

{
  "projectName": "项目名称（保持不变或更新）",
  "description": "描述（可更新）",
  "totalCost": 新的总成本,
  "items": [完整的更新后的元件数组],
  "suggestedParts": [],
  "reasoning": "简要说明你做了哪些修改及原因"
}

重要规则：
1. 返回的 items 必须是完整的、可以直接使用的 BOM 数组
2. category 只能使用：mcu, sensor, actuator, power, module, structural, enclosure, misc
3. 优先使用 lcscId（立创商城编号）便于采购
4. 价格单位：人民币元
5. 如果指令不明确，选择最合理的解释并执行
6. 不要凭空编造 lcscId，基于实际常见元件填写`

// ─── Build messages array ─────────────────────────────────────────────────────

function buildMessages(
  userContent: string,
  mode: BOMMode,
  ctx: BOMContext
): { role: 'system' | 'user'; content: string }[] {
  if (mode === 'generate') {
    return [
      { role: 'system', content: SYSTEM_GENERATE },
      { role: 'user', content: userContent },
    ]
  }

  // modify mode
  const partsList = (ctx.currentParts ?? [])
    .map(
      (p, i) =>
        `${i + 1}. ${p.name} | 数量:${p.quantity} | 类别:${p.category} | 单价:¥${p.unitCost} | 型号:${p.partNumber} | lcscId:${p.lcscId ?? '无'}`
    )
    .join('\n')

  const historySection =
    ctx.history && ctx.history.length > 0
      ? '\n\n=== 对话历史 ===\n' +
        ctx.history
          .map((h) => `${h.role === 'user' ? '用户' : '助手'}: ${h.content}`)
          .join('\n') +
        '\n================\n\n'
      : ''

  const contextBlock = `
=== 当前项目 ===
项目名：${ctx.projectName ?? '未命名项目'}
已有元件清单：
${partsList || '（空）'}
${historySection}
=== 修改指令 ===
${userContent}
`

  return [
    { role: 'system', content: SYSTEM_MODIFY },
    { role: 'user', content: contextBlock },
  ]
}

// ─── Stream helper ─────────────────────────────────────────────────────────────

async function streamBOM(
  messages: { role: 'system' | 'user'; content: string }[],
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
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4000,
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
            // Only emit thinking if there's non-JSON content.
            // Wait for {" — the actual JSON object start — not a lone {
            const jsonMarkerIdx = fullText.indexOf('{"')

            if (jsonMarkerIdx !== -1) {
              // JSON object has started — emit thinking content up to the marker
              const thinkingText = fullText.slice(0, jsonMarkerIdx)
              if (thinkingText) {
                onChunk({ phase: 'thinking', thinking: thinkingText })
              }
              thinkingDone = true
              onChunk({ phase: 'parsing', progress: '正在解析 BOM…' })
            }
            // else: token is part of thinking text, accumulate silently
          }
        } catch {
          // Skip malformed lines
        }
      }
    }

    // Parse final JSON — robust multi-stage recovery
    if (fullText) {
      try {
        const jsonStart = fullText.indexOf('{')
        const jsonEnd = fullText.lastIndexOf('}')
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonStr = fullText.slice(jsonStart, jsonEnd + 1)

          // Stage 1: strict parse
          try {
            const result = JSON.parse(jsonStr) as BOMResult
            const itemCount = result.items?.length ?? 0
            if (!doneEmitted) {
              doneEmitted = true
              onChunk({ phase: 'done', progress: `已生成 ${itemCount} 个元件，总成本 ¥${result.totalCost}`, result })
            }
            return
          } catch {
            // Stage 2: sanitize truncation artifacts
            const sanitized = jsonStr
              .replace(/\"[^\"]*$/, '')                   // truncate incomplete trailing string
              .replace(/,(\s*[\]\}])/g, '$1')            // remove trailing commas
              .replace(/([{,]\s*)([a-zA-Z_]+)\s*:/g, '$1"$2":') // quote unquoted keys

            try {
              const result = JSON.parse(sanitized) as BOMResult
              const itemCount = result.items?.length ?? 0
              if (!doneEmitted) {
                doneEmitted = true
                onChunk({ phase: 'done', progress: `已更新 ${itemCount} 个元件`, result })
              }
              return
            } catch {
              // Stage 3: extract via regex fallback
              if (!doneEmitted) {
                doneEmitted = true
                onChunk({ phase: 'error', error: 'BOM 解析失败，请重试' })
              }
            }
          }
        }
      } catch {
        if (!doneEmitted) {
          doneEmitted = true
          onChunk({ phase: 'error', error: '解析响应失败，请重试' })
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    onChunk({ phase: 'error', error: message })
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a fresh BOM from a project description
 */
export async function streamGenerateBOM(
  description: string,
  apiKey: string,
  onChunk: (chunk: StreamingChunk) => void
): Promise<void> {
  const messages = buildMessages(description, 'generate', {})
  await streamBOM(messages, apiKey, onChunk)
}

/**
 * Modify the current BOM based on a natural language instruction.
 * Pass current parts + conversation history for context.
 */
export async function streamModifyBOM(
  instruction: string,
  apiKey: string,
  context: BOMContext,
  onChunk: (chunk: StreamingChunk) => void
): Promise<void> {
  const messages = buildMessages(instruction, 'modify', context)
  await streamBOM(messages, apiKey, onChunk)
}
