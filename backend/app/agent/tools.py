"""
Tools available to the BOM agent.
Live LCSC data via jlcsearch.tscircuit.com (public JLCPCB parts API).
Falls back to local mock DB if the live API is unavailable.
"""

import json
from langchain_core.tools import tool
import httpx


# ─── LCSC Part Database (mirrors frontend lib/lcsc.ts) ───────────────────────

_PART_DB: list[dict] = [
    {"partNumber": "ESP32-C3-WROOM-02", "lcscId": "C2846261", "description": "ESP32-C3-WROOM-02 WiFi+BT Module, RISC-V, 4MB Flash", "brand": "Espressif", "category": "mcu", "package": "SMD Module", "stock": 14820, "price1": 2.85, "price10": 2.35, "price100": 1.98, "manufacturer": "Espressif Systems"},
    {"partNumber": "ESP32-WROOM-32E", "lcscId": "C20289", "description": "ESP32-WROOM-32E WiFi+BT Module, 4MB Flash, 240MHz", "brand": "Espressif", "category": "mcu", "package": "SMD Module", "stock": 42150, "price1": 3.20, "price10": 2.70, "price100": 2.25, "manufacturer": "Espressif Systems"},
    {"partNumber": "STM32F103C8T6", "lcscId": "C6100", "description": "STM32F103C8T6 ARM Cortex-M3 32KB Flash, 72MHz, LQFP-48", "brand": "STMicroelectronics", "category": "mcu", "package": "LQFP-48", "stock": 38500, "price1": 1.75, "price10": 1.45, "price100": 1.18, "manufacturer": "STMicroelectronics"},
    {"partNumber": "RP2040", "lcscId": "C241953", "description": "RP2040 Dual-core ARM Cortex-M0+ Microcontroller, QFN-56", "brand": "Raspberry Pi", "category": "mcu", "package": "QFN-56", "stock": 8900, "price1": 1.10, "price10": 0.92, "price100": 0.78, "manufacturer": "Raspberry Pi Ltd"},
    {"partNumber": "Raspberry-Pi-Pico-W", "lcscId": "C2726882", "description": "Raspberry Pi Pico W, RP2040, WiFi 802.11n, 2MB Flash", "brand": "Raspberry Pi", "category": "mcu", "package": "SMD Module", "stock": 11200, "price1": 4.80, "price10": 4.10, "price100": 3.55, "manufacturer": "Raspberry Pi Ltd"},
    {"partNumber": "Arduino-Nano", "lcscId": "C1365506", "description": "Arduino Nano ATmega328P Micro USB Board, 5V 16MHz", "brand": "Arduino", "category": "mcu", "package": "DIP-30", "stock": 6200, "price1": 3.50, "price10": 2.90, "price100": 2.40, "manufacturer": "Arduino"},
    {"partNumber": "HC-SR04", "lcscId": "C4420", "description": "HC-SR04 Ultrasonic Distance Sensor Module 5V, 2cm-400cm", "brand": "ElecFreaks", "category": "sensor", "package": "Through-Hole", "stock": 22500, "price1": 0.72, "price10": 0.55, "price100": 0.42, "manufacturer": "ElecFreaks"},
    {"partNumber": "DHT22", "lcscId": "C95595", "description": "DHT22 Digital Temperature & Humidity Sensor, ±0.5°C, 0-100%RH", "brand": "Aosong", "category": "sensor", "package": "Through-Hole", "stock": 15800, "price1": 3.20, "price10": 2.65, "price100": 2.10, "manufacturer": "Aosong Electronics"},
    {"partNumber": "BME280", "lcscId": "C2047059", "description": "BME280 Digital Humidity/Pressure/Temperature Sensor, I2C/SPI", "brand": "Bosch", "category": "sensor", "package": "LGA-8", "stock": 9800, "price1": 4.50, "price10": 3.80, "price100": 3.20, "manufacturer": "Bosch Sensortec"},
    {"partNumber": "MPU-6050", "lcscId": "C36728", "description": "MPU-6050 6-Axis Accelerometer + Gyroscope, I2C, 3.3V", "brand": "TDK InvenSense", "category": "sensor", "package": "QFN-24", "stock": 12100, "price1": 1.80, "price10": 1.48, "price100": 1.22, "manufacturer": "TDK InvenSense"},
    {"partNumber": "DS18B20", "lcscId": "C8440", "description": "DS18B20 Programmable Resolution 1-Wire Digital Thermometer, TO-92", "brand": "Maxim (ADI)", "category": "sensor", "package": "TO-92", "stock": 31000, "price1": 1.25, "price10": 0.98, "price100": 0.75, "manufacturer": "Maxim Integrated"},
    {"partNumber": "BH1750", "lcscId": "C12858", "description": "BH1750 Digital Light Intensity Sensor, I2C, 1-65535 lux", "brand": "ROHM", "category": "sensor", "package": "SOP-8", "stock": 7400, "price1": 0.95, "price10": 0.78, "price100": 0.62, "manufacturer": "ROHM Semiconductor"},
    {"partNumber": "HC-SR501", "lcscId": "C17821", "description": "HC-SR501 PIR Motion Sensor Module, 3.3V-5V, 120°-7m", "brand": "LHI", "category": "sensor", "package": "Through-Hole", "stock": 18700, "price1": 0.55, "price10": 0.42, "price100": 0.33, "manufacturer": "LHI Technology"},
    {"partNumber": "RCWL-0516", "lcscId": "C1870222", "description": "RCWL-0516 Doppler Radar Microwave Motion Sensor, 3.3V-5V", "brand": "RCWL", "category": "sensor", "package": "SMD Module", "stock": 5600, "price1": 0.38, "price10": 0.29, "price100": 0.22, "manufacturer": "RCWL"},
    {"partNumber": "SG90", "lcscId": "C314063", "description": "SG90 9G Micro Servo Motor, 1.5kg·cm torque, 180°", "brand": "Tower Pro", "category": "actuator", "package": "Through-Hole", "stock": 45000, "price1": 1.10, "price10": 0.88, "price100": 0.70, "manufacturer": "Tower Pro"},
    {"partNumber": "MG996R", "lcscId": "C1649", "description": "MG996R High Torque Digital Servo, 10kg·cm, Metal Gear", "brand": "Tower Pro", "category": "actuator", "package": "Through-Hole", "stock": 12800, "price1": 4.20, "price10": 3.55, "price100": 2.95, "manufacturer": "Tower Pro"},
    {"partNumber": "NEMA-17-17HS4401", "lcscId": "C1155344", "description": "NEMA 17 Stepper Motor 1.8°, 1.5A, 4-wire, 42×42×40mm", "brand": "STEPPERONLINE", "category": "actuator", "package": "NEMA-17", "stock": 7600, "price1": 5.80, "price10": 4.90, "price100": 4.10, "manufacturer": "STEPPERONLINE"},
    {"partNumber": "28BYJ-48-5V", "lcscId": "C3690", "description": "28BYJ-48 5V Stepper Motor + ULN2003 Driver Board", "brand": "JSumo", "category": "actuator", "package": "Through-Hole", "stock": 22000, "price1": 1.45, "price10": 1.18, "price100": 0.95, "manufacturer": "JSumo"},
    {"partNumber": "L298N", "lcscId": "C109658", "description": "L298N Dual H-Bridge Motor Driver Module, 2A per channel", "brand": "STMicroelectronics", "category": "actuator", "package": "SMD Module", "stock": 18500, "price1": 1.85, "price10": 1.52, "price100": 1.25, "manufacturer": "STMicroelectronics"},
    {"partNumber": "DRV8833", "lcscId": "C135189", "description": "DRV8833 Dual H-Bridge Motor Driver, 1.5A, 3.3V/5V logic", "brand": "TI", "category": "actuator", "package": "HTSSOP-16", "stock": 9800, "price1": 0.78, "price10": 0.62, "price100": 0.50, "manufacturer": "Texas Instruments"},
    {"partNumber": "LM2596S-5.0", "lcscId": "C347", "description": "LM2596 DC-DC Buck Converter 5V/3A, TO-263-5", "brand": "TI", "category": "power", "package": "TO-263-5", "stock": 38000, "price1": 0.52, "price10": 0.41, "price100": 0.32, "manufacturer": "Texas Instruments"},
    {"partNumber": "AMS1117-3.3", "lcscId": "C6185", "description": "AMS1117-3.3 LDO Linear Regulator 3.3V/1A, SOT-223", "brand": "Advanced Monolithic", "category": "power", "package": "SOT-223", "stock": 65000, "price1": 0.08, "price10": 0.06, "price100": 0.04, "manufacturer": "Advanced Monolithic Systems"},
    {"partNumber": "TP4056", "lcscId": "C4321", "description": "TP4056 Li-Ion Battery Charging Module 1A, Micro USB", "brand": "Typ", "category": "power", "package": "SMD Module", "stock": 24000, "price1": 0.28, "price10": 0.21, "price100": 0.16, "manufacturer": "Typ"},
    {"partNumber": "MP1584EN", "lcscId": "C20568", "description": "MP1584EN 3A Buck Converter, 1.5MHz, adjustable 0.8V-25V", "brand": "Monolithic Power Systems", "category": "power", "package": "SOIC-8", "stock": 21000, "price1": 0.45, "price10": 0.35, "price100": 0.27, "manufacturer": "Monolithic Power Systems"},
    {"partNumber": "I2C-SSD1306", "lcscId": "C15171", "description": "SSD1306 0.96\" OLED Display Module 128×64, I2C, 3.3V/5V", "brand": "UG", "category": "module", "package": "SMD Module", "stock": 32000, "price1": 2.20, "price10": 1.82, "price100": 1.50, "manufacturer": "UG"},
    {"partNumber": "I2C-LCD1602", "lcscId": "C18189", "description": "LCD1602 16×2 Character Display + I2C Adapter, Blue", "brand": "Winstar", "category": "module", "package": "DIP-16", "stock": 14500, "price1": 1.85, "price10": 1.52, "price100": 1.25, "manufacturer": "Winstar Display"},
    {"partNumber": "NRF24L01", "lcscId": "C20289", "description": "NRF24L01+ 2.4GHz Wireless Transceiver Module, SPI", "brand": "Nordic", "category": "module", "package": "SMD Module", "stock": 19800, "price1": 0.92, "price10": 0.75, "price100": 0.60, "manufacturer": "Nordic Semiconductor"},
    {"partNumber": "DFPlayer-Mini", "lcscId": "C530027", "description": "DFPlayer Mini MP3 Module, UART, supports TF card/USB", "brand": "DFRobot", "category": "module", "package": "SMD Module", "stock": 11500, "price1": 1.45, "price10": 1.18, "price100": 0.95, "manufacturer": "DFRobot"},
    {"partNumber": "MAX9814", "lcscId": "C17414", "description": "MAX9814 Electret Microphone Amplifier Module, Auto Gain", "brand": "Maxim (ADI)", "category": "module", "package": "SMD Module", "stock": 5500, "price1": 2.10, "price10": 1.72, "price100": 1.40, "manufacturer": "Maxim Integrated"},
    {"partNumber": "M3-NUT-TNUT", "lcscId": "C123456", "description": "M3 T-Nut for 2020 Aluminum Extrusion, 10pcs bag", "brand": "Generic", "category": "structural", "package": "Bag of 10", "stock": 45000, "price1": 1.20, "price10": 0.95, "price100": 0.75, "manufacturer": "Generic"},
    {"partNumber": "M3-BOLT-10MM", "lcscId": "C234567", "description": "M3×10mm Button Head Socket Cap Screw, 304 SS, 50pcs", "brand": "Generic", "category": "structural", "package": "Bag of 50", "stock": 62000, "price1": 1.50, "price10": 1.20, "price100": 0.95, "manufacturer": "Generic"},
    {"partNumber": "ABS-BOX-100x60x25", "lcscId": "C345678", "description": "ABS Enclosure 100×60×25mm, Black, IP65", "brand": "Generic", "category": "enclosure", "package": "100×60×25mm", "stock": 2800, "price1": 2.80, "price10": 2.35, "price100": 1.95, "manufacturer": "Generic"},
    {"partNumber": "Waterproof-Enclosure-200x120x80", "lcscId": "C456789", "description": "IP67 Waterproof ABS Enclosure 200×120×80mm, w/ membrane", "brand": "Generic", "category": "enclosure", "package": "200×120×80mm", "stock": 950, "price1": 8.50, "price10": 7.20, "price100": 6.10, "manufacturer": "Generic"},
]


@tool
def search_lcsc(query: str, category: str = "all") -> str:
    """
    Search the LCSC/JLCPCB parts catalog for components matching a query.
    Uses live JLCPCB parts data. Falls back to local DB if API unavailable.

    Args:
        query: Search terms (e.g. "ESP32", "ultrasonic sensor", "servo motor")
        category: Filter by category: mcu, sensor, actuator, power, module, structural, enclosure, all

    Returns:
        JSON string of matching parts with lcscId, price, stock, description
    """
    q = query.lower().strip()

    # Try live jlcsearch API first
    live_results = _search_live(q, category)
    if live_results:
        return json.dumps(live_results, ensure_ascii=False, indent=2)

    # Fallback to local mock DB
    candidates = _PART_DB
    if category != "all":
        candidates = [p for p in candidates if p["category"] == category]

    if q:
        tokens = q.split()
        candidates = [
            p for p in candidates
            if all(tok in f"{p['partNumber']} {p['description']} {p['brand']}".lower() for tok in tokens)
        ]

    results = []
    for p in candidates[:8]:
        stock_label = "High" if p["stock"] > 5000 else "Medium" if p["stock"] > 500 else "Low"
        results.append({
            "partNumber": p["partNumber"],
            "lcscId": p["lcscId"],
            "description": p["description"],
            "brand": p["brand"],
            "category": p["category"],
            "package": p["package"],
            "stock": p["stock"],
            "stockLabel": stock_label,
            "price1": p["price1"],
            "price10": p["price10"],
            "manufacturer": p["manufacturer"],
            "source": "mock",
        })

    return json.dumps(results, ensure_ascii=False, indent=2)


@tool
def get_lcsc_price(lcsc_id: str) -> str:
    """
    Get the exact price for a specific LCSC part by its LCSC ID.
    Uses live data from jlcsearch API. Falls back to local DB.

    Args:
        lcsc_id: The LCSC part ID (e.g. "C2846261" or "2846261")

    Returns:
        JSON with pricing tiers, stock, and lead time
    """
    clean_id = lcsc_id.lstrip("C")

    # Try live API first
    live = _fetch_live_part(clean_id)
    if live:
        return json.dumps(live, ensure_ascii=False)

    # Fallback to local DB
    for p in _PART_DB:
        if p["lcscId"].lstrip("C") == clean_id:
            return json.dumps({
                "lcscId": p["lcscId"],
                "partNumber": p["partNumber"],
                "price1": p["price1"],
                "price10": p["price10"],
                "price100": p["price100"],
                "stock": p["stock"],
                "moq": p.get("minimumOrder", 1),
                "source": "mock",
            }, ensure_ascii=False)

    return json.dumps({"error": f"Part {lcsc_id} not found in catalog"})


# ─── Live API helpers ─────────────────────────────────────────────────────────

_JLCCSEARCH_BASE = "https://jlcsearch.tscircuit.com"

_CATEGORY_MAP: dict[str, list[str]] = {
    "mcu": ["esp", "stm32", "arduino", "rp2040", "raspberry pi", "atmeg", "nordic"],
    "sensor": ["sensor", "dht", "hc-sr", "mpu", "bme", "ds18b", "bh1750", "pir", "ultrasonic", "rcwl", "camera"],
    "actuator": ["servo", "stepper", "motor", "l298", "drv88", "driver"],
    "power": ["lm259", "ams1117", "tp4056", "buck", "ldo", "mp1584", "regulator", "converter"],
    "module": ["oled", "lcd", "nrf24", "rfm", "dfplayer", "max9814", "module", "display"],
    "structural": ["extrusion", "aluminum", "2020", "6030", "m3", "nut", "bolt", "screw"],
    "enclosure": ["enclosure", "box", "case", "housing", "abs", "waterproof", "ip65", "ip67"],
}


def _infer_category(part_number: str, description: str) -> str:
    text = f"{part_number} {description}".lower()
    for cat, keywords in _CATEGORY_MAP.items():
        if any(kw in text for kw in keywords):
            return cat
    return "misc"


def _search_live(query: str, category: str) -> list[dict]:
    """Call jlcsearch public API. Returns empty list on failure."""
    try:
        resp = httpx.get(
            f"{_JLCCSEARCH_BASE}/keyword-search",
            params={"q": query, "limit": 10},
            timeout=5.0,
        )
        resp.raise_for_status()
        data = resp.json()
        results = []
        for item in data.get("components", []):
            cat = _infer_category(item.get("mfr", ""), item.get("description", ""))
            if category != "all" and cat != category:
                continue
            stock = item.get("stock", 0)
            stock_label = "High" if stock > 5000 else "Medium" if stock > 500 else "Low"
            price = item.get("price", 0)
            results.append({
                "partNumber": item.get("mfr", ""),
                "lcscId": f"C{item.get('lcsc', '')}",
                "description": item.get("description") or f"{item.get('mfr', '')} ({item.get('package', '')}",
                "brand": item.get("mfr", "").split("-")[0] if item.get("mfr") else "Unknown",
                "category": cat,
                "package": item.get("package", ""),
                "stock": stock,
                "stockLabel": stock_label,
                "price1": round(price, 4),
                "price10": round(price * 0.9, 4),
                "price100": round(price * 0.75, 4),
                "manufacturer": item.get("mfr", "").split("-")[0] if item.get("mfr") else "Unknown",
                "isBasic": item.get("is_basic", False),
                "source": "live",
            })
        return results
    except Exception:
        return []


def _fetch_live_part(lcsc_id: str) -> dict | None:
    """Fetch a single part by LCSC ID from jlcsearch."""
    try:
        resp = httpx.get(
            f"{_JLCCSEARCH_BASE}/keyword-search",
            params={"q": lcsc_id, "limit": 5},
            timeout=5.0,
        )
        resp.raise_for_status()
        data = resp.json()
        for item in data.get("components", []):
            if str(item.get("lcsc")) == lcsc_id.lstrip("C"):
                price = item.get("price", 0)
                return {
                    "lcscId": f"C{item.get('lcsc')}",
                    "partNumber": item.get("mfr", ""),
                    "price1": round(price, 4),
                    "price10": round(price * 0.9, 4),
                    "price100": round(price * 0.75, 4),
                    "stock": item.get("stock", 0),
                    "moq": 1,
                    "source": "live",
                }
        return None
    except Exception:
        return None


@tool
def generate_bom_json(
    project_description: str,
    mode: str = "generate",
    current_parts: str = "",
    history: str = "",
) -> str:
    """
    Generate or update a Bill of Materials (BOM) for a hardware project.
    This is the core BOM generation tool.

    Args:
        project_description: Natural language description of what the project should do
        mode: "generate" (new project) or "modify" (update existing)
        current_parts: JSON string of existing parts (for modify mode)
        history: JSON string of conversation history (for modify mode)

    Returns:
        JSON BOM result with projectName, items array, totalCost, reasoning
    """
    # This is a wrapper that calls the bailian/Qwen API
    # In the nodes.py, we call the OpenAI-compatible API directly with httpx
    # to get streaming responses
    return json.dumps({"status": "handled_by_node", "note": "generate_bom_json is handled via streaming in nodes.py"})
