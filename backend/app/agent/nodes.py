"""
LangGraph nodes for the BOM agent.
Each node is a pure function: (state) -> state
"""

import json
import os
import httpx
from typing import Literal
from .state import AgentState, BOMItem
from .tools import search_lcsc, get_lcsc_price

DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "")
DASHSCOPE_BASE = "https://dashscope.aliyuncs.com/compatible-mode/v1"


# ─── Supervisor ───────────────────────────────────────────────────────────────

def supervisor(state: AgentState) -> AgentState:
    """
    Entry node. Determines if this is a generate or modify request.
    """
    msg = state["user_message"].lower()

    MODIFY_KEYWORDS = ["加", "添加", "增加", "替换", "换成", "改成", "删除", "移除", "不要", "换掉", "修改", "调整", "增加数量", "减少数量", "改变数量"]
    GENERATE_KEYWORDS = ["生成", "帮我", "设计", "创建", "给我", "新项目", "重新生成", "换一个方案", "重新设计", "build", "create", "generate", "design"]

    has_parts = len(state.get("current_parts", [])) > 0

    is_modify = any(kw in msg for kw in MODIFY_KEYWORDS)
    is_generate = any(kw in msg for kw in GENERATE_KEYWORDS)

    if has_parts and is_modify:
        mode: Literal["generate", "modify"] = "modify"
    elif is_generate or not has_parts:
        mode = "generate"
    else:
        mode = "modify"  # default to modify when project has parts

    return {**state, "mode": mode}


# ─── Think ───────────────────────────────────────────────────────────────────

async def think(state: AgentState) -> AgentState:
    """
    Uses a lightweight model call to generate reasoning before the main BOM call.
    Streams thinking to frontend via the 'reasoning' field in state.
    """
    msg = state["user_message"]
    mode = state.get("mode", "generate")
    current_parts = state.get("current_parts", [])
    history = state.get("history", [])

    if mode == "modify" and current_parts:
        prompt = f"""用户说：「{msg}」

当前项目已有 {len(current_parts)} 个元件：
{chr(10).join(f"- {p['name']} (×{p['quantity']})" for p in current_parts[:10])}

请用中文写出你的修改推理（2-3句话）：
1. 用户想要什么修改？
2. 需要搜索哪些替代元件？
3. 预计成本变化多少？

直接输出推理文字，不要 JSON。"""
    else:
        prompt = f"""用户说：「{msg}」

请用中文写出你的设计推理（2-3句话）：
1. 这个项目需要什么核心功能？
2. 关键元件有哪些类别？
3. 预计成本区间？

直接输出推理文字，不要 JSON。"""

    thinking = ""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            async with client.post(
                f"{DASHSCOPE_BASE}/chat/completions",
                headers={
                    "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "qwen-max-latest",
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": True,
                    "max_tokens": 300,
                    "temperature": 0.7,
                },
            ) as resp:
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:].strip()
                    if data == "[DONE]":
                        break
                    try:
                        parsed = json.loads(data)
                        delta = parsed["choices"][0].get("delta", {})
                        token = delta.get("content") or ""
                        thinking += token
                    except (json.JSONDecodeError, KeyError):
                        continue
    except Exception as e:
        thinking = f"[推理过程中出现错误: {e}]"

    return {**state, "reasoning": thinking, "phase": "thinking"}


# ─── Search ───────────────────────────────────────────────────────────────────

async def search(state: AgentState) -> AgentState:
    """
    Search LCSC for key parts mentioned in the user message.
    This gives us real pricing before generating the BOM.
    """
    msg = state["user_message"].lower()
    mode = state.get("mode", "generate")

    # Extract likely part keywords from message
    keywords = {
        "esp32": "ESP32 WiFi module",
        "stm32": "STM32 microcontroller",
        "arduino": "Arduino board",
        "ultrasonic": "ultrasonic sensor",
        "dht": "DHT22 temperature sensor",
        "bme280": "BME280 temperature humidity pressure sensor",
        "servo": "servo motor",
        "motor": "stepper motor",
        "nema": "NEMA 17 stepper motor",
        "oled": "OLED display SSD1306",
        "lcd": "LCD display",
        "camera": "camera module",
        "battery": "battery 18650",
        "lipo": "LiPo battery",
        "lm2596": "LM2596 buck converter",
        "l298": "L298N motor driver",
        "pi pico": "Raspberry Pi Pico",
        "pi camera": "Raspberry Pi camera",
    }

    queries_to_run = []
    for kw, desc in keywords.items():
        if kw in msg:
            queries_to_run.append((kw, desc))

    # For modify mode, always try to find replacement parts
    if mode == "modify" and len(queries_to_run) == 0:
        # Extract the part name being modified
        queries_to_run.append(("generic", msg[:50]))

    search_results = {}
    for kw, query in queries_to_run[:4]:  # limit to 4 searches
        try:
            result = search_lcsc.invoke({"query": query, "category": "all"})
            search_results[kw] = result
        except Exception:
            search_results[kw] = "{}"

    return {
        **state,
        "reasoning": state.get("reasoning", "") + f"\n\n[已搜索 LCSC：{', '.join(k for k,_ in queries_to_run) if queries_to_run else '未发现特定元件'}]",
        "phase": "searching",
    }


# ─── Generate BOM ─────────────────────────────────────────────────────────────

async def generate_bom(state: AgentState) -> AgentState:
    """
    Calls Qwen-Max to generate or modify the BOM.
    Streams the result to the frontend via the API route.
    The actual streaming is handled by the API route calling this agent.
    """
    mode = state.get("mode", "generate")
    msg = state["user_message"]
    current_parts = state.get("current_parts", [])
    history = state.get("history", [])
    project_name = state.get("project_name", "未命名项目")
    reasoning_so_far = state.get("reasoning", "")

    if mode == "generate":
        system = f"""你是一个硬件原型 BOM 专家。

当前推理背景：{reasoning_so_far[:500]}

请生成完整的 BOM JSON，直接返回 JSON 对象（不要 markdown 代码块）。

BOM 格式：
{{
  "projectName": "项目名称",
  "description": "项目简介",
  "totalCost": 数字,
  "items": [
    {{
      "name": "元件名称",
      "quantity": 数字,
      "description": "规格描述",
      "category": "mcu/sensor/actuator/power/module/structural/enclosure/misc",
      "unitCost": 数字（元）,
      "supplier": "LCSC",
      "partNumber": "型号",
      "lcscId": "Cxxxxxxxx",
      "hqPartNumber": ""
    }}
  ],
  "reasoning": "设计思路（与上述推理背景一致）"
}}

重要：每个元件的 lcscId 必须使用真实 LCSC 编号（格式 Cxxxxxxx）。
价格统一使用人民币（元）。
category 只能是这8个值之一：mcu, sensor, actuator, power, module, structural, enclosure, misc"""
        user_content = f"用户需求：{msg}"
    else:
        parts_list = "\n".join(
            f"- {p['name']} | 数量:{p['quantity']} | 类别:{p['category']} | 单价:¥{p['unitCost']} | lcscId:{p.get('lcscId', '无')}"
            for p in current_parts
        )
        system = f"""你是一个硬件 BOM 专家，擅长根据用户指令修改现有物料清单。

当前推理背景：{reasoning_so_far[:500]}

修改指令：{msg}

已有元件清单：
{parts_list}

规则：
- 返回完整的、更新后的 BOM JSON（不是只返回变化的部分）
- category 只能是：mcu, sensor, actuator, power, module, structural, enclosure, misc
- lcscId 使用真实 LCSC 编号（格式 Cxxxxxxx）
- 价格单位：人民币（元）

直接返回 JSON，不要 markdown 代码块。"""
        user_content = f"修改指令：{msg}"

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.post(
                f"{DASHSCOPE_BASE}/chat/completions",
                headers={
                    "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "qwen-max-latest",
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user_content},
                    ],
                    "stream": True,
                    "max_tokens": 4000,
                    "temperature": 0.7,
                },
            ) as resp:
                full_text = ""
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:].strip()
                    if data == "[DONE]":
                        break
                    try:
                        parsed = json.loads(data)
                        delta = parsed["choices"][0].get("delta", {})
                        token = delta.get("content") or ""
                        full_text += token
                    except (json.JSONDecodeError, KeyError):
                        continue

        # Parse the JSON from the response
        json_start = full_text.find("{")
        json_end = full_text.rfind("}")
        if json_start != -1 and json_end != -1:
            json_str = full_text[json_start:json_end + 1]
            try:
                result = json.loads(json_str)
                return {
                    **state,
                    "result": result,
                    "phase": "done",
                    "reasoning": result.get("reasoning", reasoning_so_far),
                }
            except json.JSONDecodeError:
                return {
                    **state,
                    "error": "BOM 解析失败，请重试",
                    "phase": "error",
                }
        else:
            return {**state, "error": "未能生成 BOM，请重试", "phase": "error"}

    except Exception as e:
        return {**state, "error": str(e), "phase": "error"}


# ─── Route ────────────────────────────────────────────────────────────────────

def route_after_think(state: AgentState) -> Literal["search", "generate_bom"]:
    """Decide next step after thinking."""
    mode = state.get("mode", "generate")
    msg = state["user_message"].lower()

    # Check if specific parts were mentioned that need searching
    PART_KEYWORDS = ["esp32", "stm32", "ultrasonic", "dht", "bme", "servo", "motor", "nema", "oled", "lcd", "camera", "battery", "lipo", "lm259", "l298", "pico", "raspberry"]
    needs_search = any(kw in msg for kw in PART_KEYWORDS)

    if needs_search and mode == "generate":
        return "search"
    return "generate_bom"


def route_after_search(state: AgentState) -> Literal["generate_bom"]:
    """Always go to generate after search."""
    return "generate_bom"
