/**
 * LCSC Parts Search
 *
 * Uses jlcsearch.tscircuit.com (public JLCPCB parts API) for real-time data.
 * Falls back to local mock database if API is unavailable.
 *
 * jlcsearch API docs: https://github.com/tscircuit/jlcsearch
 * No API key required — this is a public community API.
 */

export interface LCSCPart {
  partNumber: string
  lcscId: string
  description: string
  brand: string
  category: string
  package: string
  stock: number
  price1: number   // USD, 1+ units
  price10: number  // USD, 10+ units
  price100: number // USD, 100+ units
  datasheetUrl: string
  imageUrl: string
  minimumOrder: number
  manufacturer: string
}

// ─── Realistic mock database (fallback) ────────────────────────────────────────

const PART_DATABASE: LCSCPart[] = [
  // ── MCUs ──────────────────────────────────────────────────────────────────
  {
    partNumber: 'ESP32-C3-WROOM-02', lcscId: 'C2846261',
    description: 'ESP32-C3-WROOM-02 WiFi+BT Module, RISC-V, 4MB Flash',
    brand: 'Espressif', category: 'mcu', package: 'SMD Module',
    stock: 14820, price1: 2.85, price10: 2.35, price100: 1.98,
    datasheetUrl: 'https://www.lcsc.com/product-detail/ESP32-C3-WROOM-02_C2846261.html',
    imageUrl: 'https://cdn.img.lcsc.com/lcsc/2846261-front.jpg', minimumOrder: 1,
    manufacturer: 'Espressif Systems',
  },
  {
    partNumber: 'ESP32-WROOM-32E', lcscId: 'C20289',
    description: 'ESP32-WROOM-32E WiFi+BT Module, 4MB Flash, 240MHz',
    brand: 'Espressif', category: 'mcu', package: 'SMD Module',
    stock: 42150, price1: 3.20, price10: 2.70, price100: 2.25,
    datasheetUrl: 'https://www.lcsc.com/product-detail/ESP32-WROOM-32E_C20289.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/20289-front.jpg', minimumOrder: 1,
    manufacturer: 'Espressif Systems',
  },
  {
    partNumber: 'STM32F103C8T6', lcscId: 'C6100',
    description: 'STM32F103C8T6 ARM Cortex-M3 32KB Flash, 72MHz, LQFP-48',
    brand: 'STMicroelectronics', category: 'mcu', package: 'LQFP-48',
    stock: 38500, price1: 1.75, price10: 1.45, price100: 1.18,
    datasheetUrl: 'https://www.lcsc.com/product-detail/STM32F103C8T6_C6100.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/6100-front.jpg', minimumOrder: 1,
    manufacturer: 'STMicroelectronics',
  },
  {
    partNumber: 'RP2040', lcscId: 'C241953',
    description: 'RP2040 Dual-core ARM Cortex-M0+ Microcontroller, QFN-56',
    brand: 'Raspberry Pi', category: 'mcu', package: 'QFN-56',
    stock: 8900, price1: 1.10, price10: 0.92, price100: 0.78,
    datasheetUrl: 'https://www.lcsc.com/product-detail/RP2040_C241953.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/241953-front.jpg', minimumOrder: 1,
    manufacturer: 'Raspberry Pi Ltd',
  },
  {
    partNumber: 'Arduino-Nano', lcscId: 'C1365506',
    description: 'Arduino Nano ATmega328P Micro USB Board, 5V 16MHz',
    brand: 'Arduino', category: 'mcu', package: 'DIP-30',
    stock: 6200, price1: 3.50, price10: 2.90, price100: 2.40,
    datasheetUrl: 'https://www.lcsc.com/product-detail/Arduino-Nano_C1365506.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/1365506-front.jpg', minimumOrder: 1,
    manufacturer: 'Arduino',
  },
  {
    partNumber: 'Raspberry-Pi-Pico-W', lcscId: 'C2726882',
    description: 'Raspberry Pi Pico W, RP2040, WiFi 802.11n, 2MB Flash',
    brand: 'Raspberry Pi', category: 'mcu', package: 'SMD Module',
    stock: 11200, price1: 4.80, price10: 4.10, price100: 3.55,
    datasheetUrl: 'https://www.lcsc.com/product-detail/Pico-W_C2726882.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/2726882-front.jpg', minimumOrder: 1,
    manufacturer: 'Raspberry Pi Ltd',
  },
  // ── Sensors ───────────────────────────────────────────────────────────────
  {
    partNumber: 'HC-SR04', lcscId: 'C4420',
    description: 'HC-SR04 Ultrasonic Distance Sensor Module 5V, 2cm-400cm',
    brand: 'ElecFreaks', category: 'sensor', package: 'Through-Hole',
    stock: 22500, price1: 0.72, price10: 0.55, price100: 0.42,
    datasheetUrl: 'https://www.lcsc.com/product-detail/HC-SR04_C4420.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/4420-front.jpg', minimumOrder: 1,
    manufacturer: 'ElecFreaks',
  },
  {
    partNumber: 'DHT22', lcscId: 'C95595',
    description: 'DHT22 Digital Temperature & Humidity Sensor, ±0.5°C, 0-100%RH',
    brand: 'Aosong', category: 'sensor', package: 'Through-Hole',
    stock: 15800, price1: 3.20, price10: 2.65, price100: 2.10,
    datasheetUrl: 'https://www.lcsc.com/product-detail/DHT22_C95595.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/95595-front.jpg', minimumOrder: 1,
    manufacturer: 'Aosong Electronics',
  },
  {
    partNumber: 'BME280', lcscId: 'C2047059',
    description: 'BME280 Digital Humidity/Pressure/Temperature Sensor, I2C/SPI',
    brand: 'Bosch', category: 'sensor', package: 'LGA-8',
    stock: 9800, price1: 4.50, price10: 3.80, price100: 3.20,
    datasheetUrl: 'https://www.lcsc.com/product-detail/BME280_C2047059.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/2047059-front.jpg', minimumOrder: 1,
    manufacturer: 'Bosch Sensortec',
  },
  {
    partNumber: 'MPU-6050', lcscId: 'C36728',
    description: 'MPU-6050 6-Axis Accelerometer + Gyroscope, I2C, 3.3V',
    brand: 'TDK InvenSense', category: 'sensor', package: 'QFN-24',
    stock: 12100, price1: 1.80, price10: 1.48, price100: 1.22,
    datasheetUrl: 'https://www.lcsc.com/product-detail/MPU-6050_C36728.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/36728-front.jpg', minimumOrder: 1,
    manufacturer: 'TDK InvenSense',
  },
  {
    partNumber: 'DS18B20', lcscId: 'C8440',
    description: 'DS18B20 Programmable Resolution 1-Wire Digital Thermometer, TO-92',
    brand: 'Maxim (ADI)', category: 'sensor', package: 'TO-92',
    stock: 31000, price1: 1.25, price10: 0.98, price100: 0.75,
    datasheetUrl: 'https://www.lcsc.com/product-detail/DS18B20_C8440.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/8440-front.jpg', minimumOrder: 1,
    manufacturer: 'Maxim Integrated',
  },
  {
    partNumber: 'BH1750', lcscId: 'C12858',
    description: 'BH1750 Digital Light Intensity Sensor, I2C, 1-65535 lux',
    brand: 'ROHM', category: 'sensor', package: 'SOP-8',
    stock: 7400, price1: 0.95, price10: 0.78, price100: 0.62,
    datasheetUrl: 'https://www.lcsc.com/product-detail/BH1750_C12858.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/12858-front.jpg', minimumOrder: 1,
    manufacturer: 'ROHM Semiconductor',
  },
  {
    partNumber: 'HC-SR501', lcscId: 'C17821',
    description: 'HC-SR501 PIR Motion Sensor Module, 3.3V-5V, 120°-7m',
    brand: 'LHI', category: 'sensor', package: 'Through-Hole',
    stock: 18700, price1: 0.55, price10: 0.42, price100: 0.33,
    datasheetUrl: 'https://www.lcsc.com/product-detail/HC-SR501_C17821.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/17821-front.jpg', minimumOrder: 1,
    manufacturer: 'LHI Technology',
  },
  {
    partNumber: 'RCWL-0516', lcscId: 'C1870222',
    description: 'RCWL-0516 Doppler Radar Microwave Motion Sensor, 3.3V-5V',
    brand: 'RCWL', category: 'sensor', package: 'SMD Module',
    stock: 5600, price1: 0.38, price10: 0.29, price100: 0.22,
    datasheetUrl: 'https://www.lcsc.com/product-detail/RCWL-0516_C1870222.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/1870222-front.jpg', minimumOrder: 1,
    manufacturer: 'RCWL',
  },
  // ── Actuators ─────────────────────────────────────────────────────────────
  {
    partNumber: 'SG90', lcscId: 'C314063',
    description: 'SG90 9G Micro Servo Motor, 1.5kg·cm torque, 180°',
    brand: 'Tower Pro', category: 'actuator', package: 'Through-Hole',
    stock: 45000, price1: 1.10, price10: 0.88, price100: 0.70,
    datasheetUrl: 'https://www.lcsc.com/product-detail/SG90_C314063.html',
    imageUrl: 'https://cdn.img.lcsc.com/lcsc/314063-front.jpg', minimumOrder: 1,
    manufacturer: 'Tower Pro',
  },
  {
    partNumber: 'MG996R', lcscId: 'C1649',
    description: 'MG996R High Torque Digital Servo, 10kg·cm, Metal Gear',
    brand: 'Tower Pro', category: 'actuator', package: 'Through-Hole',
    stock: 12800, price1: 4.20, price10: 3.55, price100: 2.95,
    datasheetUrl: 'https://www.lcsc.com/product-detail/MG996R_C1649.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/1649-front.jpg', minimumOrder: 1,
    manufacturer: 'Tower Pro',
  },
  {
    partNumber: 'NEMA-17-17HS4401', lcscId: 'C1155344',
    description: 'NEMA 17 Stepper Motor 1.8°, 1.5A, 4-wire, 42×42×40mm',
    brand: 'STEPPERONLINE', category: 'actuator', package: 'NEMA-17',
    stock: 7600, price1: 5.80, price10: 4.90, price100: 4.10,
    datasheetUrl: 'https://www.lcsc.com/product-detail/17HS4401_C1155344.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/1155344-front.jpg', minimumOrder: 1,
    manufacturer: 'STEPPERONLINE',
  },
  {
    partNumber: '28BYJ-48-5V', lcscId: 'C3690',
    description: '28BYJ-48 5V Stepper Motor + ULN2003 Driver Board',
    brand: 'JSumo', category: 'actuator', package: 'Through-Hole',
    stock: 22000, price1: 1.45, price10: 1.18, price100: 0.95,
    datasheetUrl: 'https://www.lcsc.com/product-detail/28BYJ-48_C3690.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/3690-front.jpg', minimumOrder: 1,
    manufacturer: 'JSumo',
  },
  {
    partNumber: 'L298N', lcscId: 'C109658',
    description: 'L298N Dual H-Bridge Motor Driver Module, 2A per channel',
    brand: 'STMicroelectronics', category: 'actuator', package: 'SMD Module',
    stock: 18500, price1: 1.85, price10: 1.52, price100: 1.25,
    datasheetUrl: 'https://www.lcsc.com/product-detail/L298N_C109658.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/109658-front.jpg', minimumOrder: 1,
    manufacturer: 'STMicroelectronics',
  },
  {
    partNumber: 'DRV8833', lcscId: 'C135189',
    description: 'DRV8833 Dual H-Bridge Motor Driver, 1.5A, 3.3V/5V logic',
    brand: 'TI', category: 'actuator', package: 'HTSSOP-16',
    stock: 9800, price1: 0.78, price10: 0.62, price100: 0.50,
    datasheetUrl: 'https://www.lcsc.com/product-detail/DRV8833_C135189.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/135189-front.jpg', minimumOrder: 1,
    manufacturer: 'Texas Instruments',
  },
  // ── Power ─────────────────────────────────────────────────────────────────
  {
    partNumber: 'LM2596S-5.0', lcscId: 'C347',
    description: 'LM2596 DC-DC Buck Converter 5V/3A, TO-263-5',
    brand: 'TI', category: 'power', package: 'TO-263-5',
    stock: 38000, price1: 0.52, price10: 0.41, price100: 0.32,
    datasheetUrl: 'https://www.lcsc.com/product-detail/LM2596S-5-0_C347.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/347-front.jpg', minimumOrder: 1,
    manufacturer: 'Texas Instruments',
  },
  {
    partNumber: 'AMS1117-3.3', lcscId: 'C6185',
    description: 'AMS1117-3.3 LDO Linear Regulator 3.3V/1A, SOT-223',
    brand: 'Advanced Monolithic', category: 'power', package: 'SOT-223',
    stock: 65000, price1: 0.08, price10: 0.06, price100: 0.04,
    datasheetUrl: 'https://www.lcsc.com/product-detail/AMS1117-3-3_C6185.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/6185-front.jpg', minimumOrder: 1,
    manufacturer: 'Advanced Monolithic Systems',
  },
  {
    partNumber: 'TP4056', lcscId: 'C4321',
    description: 'TP4056 Li-Ion Battery Charging Module 1A, Micro USB',
    brand: 'Typ', category: 'power', package: 'SMD Module',
    stock: 24000, price1: 0.28, price10: 0.21, price100: 0.16,
    datasheetUrl: 'https://www.lcsc.com/product-detail/TP4056_C4321.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/4321-front.jpg', minimumOrder: 1,
    manufacturer: 'Typ',
  },
  {
    partNumber: 'MP1584EN', lcscId: 'C20568',
    description: 'MP1584EN 3A Buck Converter, 1.5MHz, adjustable 0.8V-25V',
    brand: 'Monolithic Power Systems', category: 'power', package: 'SOIC-8',
    stock: 21000, price1: 0.45, price10: 0.35, price100: 0.27,
    datasheetUrl: 'https://www.lcsc.com/product-detail/MP1584EN_C20568.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/20568-front.jpg', minimumOrder: 1,
    manufacturer: 'Monolithic Power Systems',
  },
  // ── Modules ───────────────────────────────────────────────────────────────
  {
    partNumber: 'I2C-SSD1306', lcscId: 'C15171',
    description: 'SSD1306 0.96" OLED Display Module 128×64, I2C, 3.3V/5V',
    brand: 'UG', category: 'module', package: 'SMD Module',
    stock: 32000, price1: 2.20, price10: 1.82, price100: 1.50,
    datasheetUrl: 'https://www.lcsc.com/product-detail/SSD1306-OLED_C15171.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/15171-front.jpg', minimumOrder: 1,
    manufacturer: 'UG',
  },
  {
    partNumber: 'I2C-LCD1602', lcscId: 'C18189',
    description: 'LCD1602 16×2 Character Display + I2C Adapter, Blue',
    brand: 'Winstar', category: 'module', package: 'DIP-16',
    stock: 14500, price1: 1.85, price10: 1.52, price100: 1.25,
    datasheetUrl: 'https://www.lcsc.com/product-detail/LCD1602_C18189.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/18189-front.jpg', minimumOrder: 1,
    manufacturer: 'Winstar Display',
  },
  {
    partNumber: 'NRF24L01', lcscId: 'C20289',
    description: 'NRF24L01+ 2.4GHz Wireless Transceiver Module, SPI',
    brand: 'Nordic', category: 'module', package: 'SMD Module',
    stock: 19800, price1: 0.92, price10: 0.75, price100: 0.60,
    datasheetUrl: 'https://www.lcsc.com/product-detail/NRF24L01_C20289.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/20289-front.jpg', minimumOrder: 1,
    manufacturer: 'Nordic Semiconductor',
  },
  {
    partNumber: 'DFPlayer-Mini', lcscId: 'C530027',
    description: 'DFPlayer Mini MP3 Module, UART, supports TF card/USB',
    brand: 'DFRobot', category: 'module', package: 'SMD Module',
    stock: 11500, price1: 1.45, price10: 1.18, price100: 0.95,
    datasheetUrl: 'https://www.lcsc.com/product-detail/DFPlayer-Mini_C530027.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/530027-front.jpg', minimumOrder: 1,
    manufacturer: 'DFRobot',
  },
  {
    partNumber: 'MAX9814', lcscId: 'C17414',
    description: 'MAX9814 Electret Microphone Amplifier Module, Auto Gain',
    brand: 'Maxim (ADI)', category: 'module', package: 'SMD Module',
    stock: 5500, price1: 2.10, price10: 1.72, price100: 1.40,
    datasheetUrl: 'https://www.lcsc.com/product-detail/MAX9814_C17414.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/17414-front.jpg', minimumOrder: 1,
    manufacturer: 'Maxim Integrated',
  },
  // ── Structural ─────────────────────────────────────────────────────────────
  {
    partNumber: '2020-300mm', lcscId: 'M3-2020-300',
    description: '2020 V-Slot Aluminum Extrusion 20×20mm, 300mm, Anodized Black',
    brand: 'OpenBuilds', category: 'structural', package: '300mm Length',
    stock: 5800, price1: 4.50, price10: 3.85, price100: 3.20,
    datasheetUrl: 'https://www.lcsc.com/product-detail/2020-Extrusion_M3-2020-300.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/m3-2020-300-front.jpg', minimumOrder: 1,
    manufacturer: 'OpenBuilds',
  },
  {
    partNumber: 'M3-BOLT-10MM', lcscId: 'C234567',
    description: 'M3×10mm Button Head Socket Cap Screw, 304 SS, 50pcs',
    brand: 'Generic', category: 'structural', package: 'Bag of 50',
    stock: 62000, price1: 1.50, price10: 1.20, price100: 0.95,
    datasheetUrl: 'https://www.lcsc.com/product-detail/M3-Bolt-10mm_C234567.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/234567-front.jpg', minimumOrder: 1,
    manufacturer: 'Generic',
  },
  // ── Enclosure ─────────────────────────────────────────────────────────────
  {
    partNumber: 'ABS-BOX-100x60x25', lcscId: 'C345678',
    description: 'ABS Enclosure 100×60×25mm, Black, IP65',
    brand: 'Generic', category: 'enclosure', package: '100×60×25mm',
    stock: 2800, price1: 2.80, price10: 2.35, price100: 1.95,
    datasheetUrl: 'https://www.lcsc.com/product-detail/ABS-Box-100x60x25_C345678.html',
    imageUrl: 'https://cdn/img.lcsc.com/lcsc/345678-front.jpg', minimumOrder: 1,
    manufacturer: 'Generic',
  },
]

// ─── Category keyword map ────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  mcu: ['esp', 'stm32', 'arduino', 'rp2040', 'raspberry pi', 'atmeg', 'pic', 'nordic'],
  sensor: ['sensor', 'dht', 'hc-sr', 'mpu', 'bme', 'ds18b', 'bh1750', 'pir', 'ultrasonic', 'rcwl', 'camera'],
  actuator: ['servo', 'stepper', 'motor', 'l298', 'drv88', 'driver', 'actuator'],
  power: ['lm259', 'ams1117', 'tp4056', 'battery', 'buck', 'ldo', 'mp1584', 'regulator', 'converter'],
  module: ['oled', 'lcd', 'nrf24', 'rfm', 'dfplayer', 'max9814', 'module', 'i2c', 'display'],
  structural: ['extrusion', 'aluminum', '2020', '6030', 'm3', 'nut', 'bolt', 'screw', 't-slot'],
  enclosure: ['enclosure', 'box', 'case', 'housing', 'abs', 'waterproof', 'ip65', 'ip67'],
}

// ─── Real API call via jlcsearch (public, no auth) ─────────────────────────

interface JlcSearchResult {
  lcsc: number
  mfr: string
  package: string
  is_basic: boolean
  is_preferred: boolean
  description: string
  stock: number
  price: number
}

interface JlcSearchResponse {
  components: JlcSearchResult[]
}

const JLCCSEARCH_BASE = 'https://jlcsearch.tscircuit.com'

async function searchRealLCSC(query: string, limit = 20): Promise<LCSCPart[]> {
  try {
    const url = `${JLCCSEARCH_BASE}/keyword-search?q=${encodeURIComponent(query)}&limit=${limit}`
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`jlcsearch HTTP ${res.status}`)

    const data: JlcSearchResponse = await res.json()
    return data.components.map((c) => ({
      partNumber: c.mfr,
      lcscId: `C${c.lcsc}`,
      description: c.description || `${c.mfr} (${c.package})`,
      brand: c.mfr.split('-')[0] || 'Unknown',
      category: inferCategory(c.mfr, c.description),
      package: c.package,
      stock: c.stock,
      price1: c.price,
      price10: c.price * 0.9,
      price100: c.price * 0.75,
      datasheetUrl: `https://www.lcsc.com/products/${c.lcsc}.html`,
      imageUrl: `https://image.lcsc.com/lcsc/${c.lcsc}-front.jpg`,
      minimumOrder: 1,
      manufacturer: c.mfr.split('-')[0] || 'Unknown',
    }))
  } catch {
    return []
  }
}

// ─── Category inference from part name/description ──────────────────────────────

function inferCategory(partNumber: string, description: string): string {
  const text = `${partNumber} ${description}`.toLowerCase()
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) return cat
  }
  return 'misc'
}

// ─── Mock fallback search ────────────────────────────────────────────────────

function searchMock(query: string, category?: string): LCSCPart[] {
  const q = query.toLowerCase().trim()
  let candidates = PART_DATABASE

  if (category && category !== 'all') {
    candidates = candidates.filter((p) => p.category === category)
  }

  if (q) {
    const tokens = q.split(/\s+/)
    candidates = candidates.filter((part) => {
      const haystack = [part.partNumber, part.description, part.brand, part.category].join(' ').toLowerCase()
      return tokens.every((t) => haystack.includes(t))
    })
    candidates.sort((a, b) => {
      return b.partNumber.toLowerCase().includes(q) ? 1 : 0
    })
  }

  if (!q && category && category !== 'all') {
    const keywords = CATEGORY_KEYWORDS[category] ?? []
    candidates = candidates.filter((p) =>
      keywords.some((kw) => p.description.toLowerCase().includes(kw))
    )
  }

  return candidates.slice(0, 20)
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Search LCSC parts — tries real jlcsearch API first, falls back to mock data.
 */
export async function searchLCSC(query: string, category?: string): Promise<LCSCPart[]> {
  if (!query.trim()) {
    // Category browse mode — use mock data
    return searchMock('', category)
  }

  // Try real API first
  const real = await searchRealLCSC(query.trim(), 20)

  if (real.length > 0) {
    // Filter by category if specified
    if (category && category !== 'all') {
      return real.filter((p) => p.category === category).slice(0, 20)
    }
    return real
  }

  // Fallback to mock
  return searchMock(query, category)
}

export function getPartsByCategory(category: string): LCSCPart[] {
  return PART_DATABASE.filter((p) => p.category === category).slice(0, 20)
}

export function getPartById(lcscId: string): LCSCPart | undefined {
  return PART_DATABASE.find((p) => p.lcscId === lcscId || p.lcscId === `C${lcscId}`)
}
