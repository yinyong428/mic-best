# Blueprint.am 项目页 - 已抓取的功能标签

## 标签页 URL 参数
- `?tab=render` - 3D 渲染视图（默认）
- `?tab=wiring` - 接线图 (React Flow)
- `?tab=graph` - 机械爆炸图 (Three.js)
- `?tab=bom` - 物料清单

## INFO 面板内容
- Trashobot_01 (项目名)
- 35 parts, $311.15 total
- Created by titano_8f08
- Created Today
- Updated Today
- Description: "This autonomous refuse bot navigates with a front ultrasonic sensor..."

## BOM 表结构
Columns: Part | Type | Qty | Unit | Source | Subtotal

Example rows:
- Raspberry Pi 4 Model B | MCU | 1 | ~$55.00 | Search on Amazon
- HC-SR04 Ultrasonic Sensor | Sensor | 1 | ~$3.00 | Search on Amazon
- NEMA 17 Stepper Motor | Actuator | 2 | ~$15.00 | Search on Amazon
- SG90 Micro Servo | Actuator | 1 | ~$5.00 | Search on Amazon
- 3S 12V LiPo Battery | Power | 1 | ~$25.00 | Search on Amazon
- Pololu 5V Regulator | Power | 1 | ~$3.50 | Search on Amazon
- L298N Motor Driver | Module | 1 | ~$8.00 | Search on Amazon
- 2020 Aluminum Extrusion | Structural | 8 | ~$7.50 | Search on Amazon
- 3D Printed Parts | 3D Print | various | various | N/A

Filters: All 35 | Electrical 10 | Mechanical 25
Views: Table | Cards

## WIRING 接线图
- Node types: MCU, SENSOR, ACTUATOR, POWER, MODULE, DISPLAY, DATA
- Control Panel: Zoom In, Zoom Out, Fit View
- Edges with voltage labels (12V, 5V, GPIO, PWM, I2S, CSI)
- All components with pin definitions

## MECH 机械视图
- Three.js 3D exploded view
- Parts numbered and labeled
- Interactive rotate/zoom

## INSTRUCTIONS 装配说明
- Step-by-step guide (7 steps)
- Progress indicator (1-7)
- Detailed text per step
- Example: "Install M4 nuts into the 2020 aluminum extrusion channels..."

## PART 零件视图
- Single part 3D model viewer
- Print specs: material, layer height, infill
- Switchable between parts
