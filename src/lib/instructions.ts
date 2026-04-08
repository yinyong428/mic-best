/**
 * Instructions AI Generator
 * Generates step-by-step assembly instructions from project BOM data.
 */

const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

export interface InstructionStep {
  step: number
  title: string
  description: string
  partIds: string[]
  tools: string[]
  tips?: string
}

export interface InstructionResult {
  phases: {
    id: string
    name: string
    icon: string
    steps: InstructionStep[]
  }[]
  tools: string[]
  assumptions: string[]
  reasoning: string
}

export type ChunkPhase = 'thinking' | 'parsing' | 'done' | 'error'

export interface StreamingChunk {
  phase: ChunkPhase
  thinking?: string
  progress?: string
  result?: InstructionResult
  error?: string
}

const SYSTEM_PROMPT = `你是一个硬件装配专家，擅长根据元件清单（BOM）生成清晰、实用的分步装配指南。

用户会给你一个项目的元件清单（BOM），包含元件名称、类别、数量、规格描述。你的任务是为这个项目生成完整的装配指南。

装配指南格式（直接返回JSON，不要markdown代码块）：
{
  "phases": [
    {
      "id": "phase-id",
      "name": "阶段名称（Fabricate/Wire/Assemble/Bring-up）",
      "icon": "emoji",
      "steps": [
        {
          "step": 1,
          "title": "步骤标题",
          "description": "详细步骤描述，包含技术要点和注意事项。",
          "partIds": ["part-id-1", "part-id-2"],
          "tools": ["工具1", "工具2"],
          "tips": "可选的小技巧或注意事项"
        }
      ]
    }
  ],
  "tools": ["通用工具清单"],
  "assumptions": ["前置假设"],
  "reasoning": "生成思路（2-3句话）"
}

阶段说明：
- Fabricate（制作）：3D打印、CNC、激光切割等制造工作
- Wire（接线）：所有电气连接、布线工作
- Assemble（装配）：机械装配、组装
- Bring-up（启动）：软件烧录、调试、测试

重要规则：
1. phase id 统一用：fabricate, wire, assemble, bringup（小写）
2. partIds 填写元件的 id（严格按照传入的元件 id）
3. tools 填写本步骤需要的工具，不要列出元件
4. 每个阶段至少2步，最多8步
5. 步骤顺序要符合真实装配逻辑（先结构后电气，先基础后调试）
6. description 要具体，结合实际元件型号（如"连接 HC-SR04 超声波传感器的 Trig 和 Echo 引脚到 ESP32 的 GPIO 15 和 GPIO 14"）
7. 如果某阶段没有相关元件，可以跳过该阶段或只有1步
8. 返回纯JSON，不要有任何markdown标记`

function buildPrompt(
  projectName: string,
  parts: { id: string; name: string; category: string; qty: number; description?: string; model: string }[]
): string {
  const partsList = parts
    .map(
      (p, i) =>
        `[${i}] id:"${p.id}" | 名称:${p.name} | 类别:${p.category} | 数量:${p.qty} | 型号:${p.model} | 描述:${p.description ?? '无'}`
    )
    .join('\n')

  return `=== 项目信息 ===
项目名称：${projectName}
元件数量：${parts.length} 个

=== BOM 元件清单 ===
${partsList}

=== 任务 ===
请为上述项目生成完整的装配指南。`
}

async function streamInstructions(
  prompt: string,
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
          { role: 'user', content: prompt },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 3500,
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
            const cleanToken = token.replace(/\{$/, '')
            if (cleanToken) {
              onChunk({ phase: 'thinking', thinking: cleanToken })
            }
            if (fullText.indexOf('{') !== -1) {
              thinkingDone = true
              onChunk({ phase: 'parsing', progress: '正在生成装配指南…' })
            }
          }
        } catch {
          // skip malformed
        }
      }
    }

    if (fullText) {
      try {
        const jsonStart = fullText.indexOf('{')
        const jsonEnd = fullText.lastIndexOf('}')
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonStr = fullText.slice(jsonStart, jsonEnd + 1)

          try {
            const result = JSON.parse(jsonStr) as InstructionResult
            if (!doneEmitted) {
              doneEmitted = true
              const totalSteps = result.phases.reduce((s, p) => s + p.steps.length, 0)
              onChunk({ phase: 'done', progress: `已生成 ${totalSteps} 个装配步骤`, result })
            }
            return
          } catch {
            // Sanitize and retry
            const sanitized = jsonStr
              .replace(/\"[^\"]*$/, '')
              .replace(/,(\s*[\]\}])/g, '$1')
              .replace(/([{,]\s*)([a-zA-Z_]+)\s*:/g, '$1"$2":')

            try {
              const result = JSON.parse(sanitized) as InstructionResult
              if (!doneEmitted) {
                doneEmitted = true
                onChunk({ phase: 'done', progress: `已生成装配指南`, result })
              }
            } catch {
              if (!doneEmitted) {
                doneEmitted = true
                onChunk({ phase: 'error', error: '解析装配指南失败，请重试' })
              }
            }
          }
        }
      } catch {
        if (!doneEmitted) {
          doneEmitted = true
          onChunk({ phase: 'error', error: '生成失败，请重试' })
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    onChunk({ phase: 'error', error: message })
  }
}

export async function streamGenerateInstructions(
  projectName: string,
  parts: { id: string; name: string; category: string; qty: number; description?: string; model: string }[],
  apiKey: string,
  onChunk: (chunk: StreamingChunk) => void
): Promise<void> {
  const prompt = buildPrompt(projectName, parts)
  await streamInstructions(prompt, apiKey, onChunk)
}
