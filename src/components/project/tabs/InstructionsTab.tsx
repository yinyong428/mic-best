'use client'

import { useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { getCategoryColor } from '@/lib/mockData'

interface PhaseStep {
  id: string
  title: string
  description: string
  partIds: string[]
  tools: string[]
}

interface Phase {
  id: string
  name: string
  icon: string
  steps: PhaseStep[]
}

function autoGeneratePhases(projectName: string, parts: { id: string; name: string; category: string }[]): Phase[] {
  const electrical = parts.filter(p => ['mcu', 'sensor', 'actuator', 'power', 'module'].includes(p.category))
  const structural = parts.filter(p => !['mcu', 'sensor', 'actuator', 'power', 'module'].includes(p.category))
  const mcuParts = electrical.filter(p => p.category === 'mcu')
  const sensorParts = electrical.filter(p => p.category === 'sensor')
  const actuatorParts = electrical.filter(p => p.category === 'actuator')
  const moduleParts = electrical.filter(p => p.category === 'module')
  const powerParts = electrical.filter(p => p.category === 'power')

  const partsById = (ids: string[]) => ids.map(id => parts.find(p => p.id === id)).filter(Boolean)

  return [
    {
      id: 'fabricate',
      name: 'Fabricate',
      icon: '🖨️',
      steps: [
        {
          id: '1.1',
          title: 'Print motor mounts and wheel hub adapters',
          description: `Print ${structural.filter(p => p.name.toLowerCase().includes('mount') || p.name.toLowerCase().includes('hub')).length} parts for motor and wheel attachment. Recommended settings: PLA for brackets, PETG for load-bearing parts.`,
          partIds: structural.filter(p => p.name.toLowerCase().includes('mount') || p.name.toLowerCase().includes('hub') || p.name.toLowerCase().includes('adapter')).map(p => p.id),
          tools: ['3D printer', 'PLA filament', 'PETG filament', 'Calipers'],
        },
        {
          id: '1.2',
          title: 'Print sensor and motor driver mounts',
          description: 'Print mounting brackets for sensors and the motor driver. Ensure good ventilation during printing.',
          partIds: structural.filter(p => p.name.toLowerCase().includes('sensor') || p.name.toLowerCase().includes('driver')).map(p => p.id),
          tools: ['3D printer', 'PLA filament'],
        },
        {
          id: '1.3',
          title: 'Print battery holder and lid mechanism parts',
          description: 'Print enclosure-related parts including battery holder and any lid/door actuator components.',
          partIds: structural.filter(p => p.name.toLowerCase().includes('battery') || p.name.toLowerCase().includes('lid') || p.name.toLowerCase().includes('holder')).map(p => p.id),
          tools: ['3D printer', 'PETG filament'],
        },
        {
          id: '1.4',
          title: 'Print structural frame and enclosure panels',
          description: 'Print the main structural components and any external shell or enclosure panels.',
          partIds: structural.filter(p => p.name.toLowerCase().includes('frame') || p.name.toLowerCase().includes('panel') || p.name.toLowerCase().includes('plate') || p.name.toLowerCase().includes('shell')).map(p => p.id),
          tools: ['3D printer', 'PLA or PETG', 'Sanding paper'],
        },
        {
          id: '1.5',
          title: 'Print controller and peripheral mounts',
          description: 'Print any remaining mounts for the main controller, camera, speaker, or other peripherals.',
          partIds: structural.filter(p => p.name.toLowerCase().includes('controller') || p.name.toLowerCase().includes('mount') && !p.name.toLowerCase().includes('motor')).map(p => p.id),
          tools: ['3D printer', 'PLA filament'],
        },
      ],
    },
    {
      id: 'wire',
      name: 'Wire',
      icon: '⚡',
      steps: [
        {
          id: '2.1',
          title: `Connect ${powerParts[0]?.name ?? 'Main Power Source'} to Motor Driver and 5V Buck Converter`,
          description: 'Route power cables from the main battery to the motor driver and voltage regulator. Use appropriate gauge wire for high-current lines.',
          partIds: [...powerParts.slice(0, 1).map(p => p.id), ...moduleParts.filter(p => p.name.toLowerCase().includes('driver') || p.name.toLowerCase().includes('regulator') || p.name.toLowerCase().includes('buck')).map(p => p.id)],
          tools: ['Wire strippers', 'Soldering iron', 'Multimeter', 'Heat shrink tubing'],
        },
        {
          id: '2.2',
          title: 'Connect 5V Buck Converter to Main Controller',
          description: `Power the ${mcuParts[0]?.name ?? 'Main Controller'} through the 5V regulator. Verify output voltage before connecting.`,
          partIds: [...moduleParts.filter(p => p.name.toLowerCase().includes('regulator') || p.name.toLowerCase().includes('buck')).map(p => p.id), ...mcuParts.map(p => p.id)],
          tools: ['Wire strippers', 'Multimeter', 'Connector plugs'],
        },
        {
          id: '2.3',
          title: 'Wire Motor Driver to Left and Right Drive Motors',
          description: 'Connect the motor driver outputs to both drive motors. Ensure correct phase wiring (A+/A-/B+/B-) for each motor.',
          partIds: [...moduleParts.filter(p => p.name.toLowerCase().includes('driver')).map(p => p.id), ...actuatorParts.filter(p => p.name.toLowerCase().includes('motor') || p.name.toLowerCase().includes('nema')).map(p => p.id)],
          tools: ['Wire strippers', 'Screwdriver', 'Multimeter'],
        },
        {
          id: '2.4',
          title: 'Connect Main Controller to Motor Driver control pins',
          description: 'Wire GPIO pins from the controller to the motor driver inputs (IN1-IN4, ENA/ENB). Use PWM pins for speed control.',
          partIds: [...mcuParts.map(p => p.id), ...moduleParts.filter(p => p.name.toLowerCase().includes('driver')).map(p => p.id)],
          tools: ['Jumper wires', 'Breadboard', 'Multimeter'],
        },
        {
          id: '2.5',
          title: 'Connect Main Controller to Front Ultrasonic Sensor',
          description: 'Wire the ultrasonic sensor (Trig/Echo) to two GPIO pins on the controller.',
          partIds: [...mcuParts.map(p => p.id), ...sensorParts.filter(p => p.name.toLowerCase().includes('ultrasonic') || p.name.toLowerCase().includes('hc-sr')).map(p => p.id)],
          tools: ['Jumper wires', 'Multimeter'],
        },
        {
          id: '2.6',
          title: 'Connect Main Controller to Lid Actuator Servo and Voice Output Speaker',
          description: 'Connect the servo signal pin to a PWM GPIO pin. Wire the I2S speaker amplifier to the controller\'s I2S pins.',
          partIds: [...mcuParts.map(p => p.id), ...actuatorParts.filter(p => p.name.toLowerCase().includes('servo') || p.name.toLowerCase().includes('actuator')).map(p => p.id), ...moduleParts.filter(p => p.name.toLowerCase().includes('speaker') || p.name.toLowerCase().includes('i2s')).map(p => p.id)],
          tools: ['Jumper wires', 'Screwdriver'],
        },
        {
          id: '2.7',
          title: 'Connect Main Controller to Vision Camera',
          description: 'Connect the camera module via CSI ribbon cable to the controller\'s camera port.',
          partIds: [...mcuParts.map(p => p.id), ...sensorParts.filter(p => p.name.toLowerCase().includes('camera') || p.name.toLowerCase().includes('vision')).map(p => p.id)],
          tools: ['CSI ribbon cable', 'Soft cloth (for handling)'],
        },
      ],
    },
    {
      id: 'bringup',
      name: 'Bring-up',
      icon: '🚀',
      steps: [
        {
          id: '3.1',
          title: 'Power on Raspberry Pi and verify OS boot',
          description: 'Insert SD card with Raspberry Pi OS, connect power, and verify the system boots without errors.',
          partIds: mcuParts.filter(p => p.name.toLowerCase().includes('raspberry')).map(p => p.id),
          tools: ['HDMI monitor', 'USB keyboard', 'SD card reader'],
        },
        {
          id: '3.2',
          title: 'Install necessary libraries and drivers for attached peripherals',
          description: 'Run package updates and install required libraries: RPi.GPIO, smbus, picamera2, servo control libraries.',
          partIds: mcuParts.map(p => p.id),
          tools: ['Internet connection', 'Terminal access'],
        },
        {
          id: '3.3',
          title: 'Test Front Ultrasonic Sensor functionality',
          description: 'Run a simple distance measurement script to verify the HC-SR04 sensor is working correctly.',
          partIds: sensorParts.filter(p => p.name.toLowerCase().includes('ultrasonic') || p.name.toLowerCase().includes('hc-sr')).map(p => p.id),
          tools: ['Python test script', 'Multimeter'],
        },
        {
          id: '3.4',
          title: 'Test Left and Right Drive Motor control via Motor Driver',
          description: 'Run motor test code to verify both motors spin in correct directions at varying speeds.',
          partIds: [...moduleParts.filter(p => p.name.toLowerCase().includes('driver')).map(p => p.id), ...actuatorParts.filter(p => p.name.toLowerCase().includes('motor') || p.name.toLowerCase().includes('nema')).map(p => p.id)],
          tools: ['Python test script', 'Oscilloscope (optional)'],
        },
        {
          id: '3.5',
          title: 'Test Lid Actuator Servo operation',
          description: 'Verify the servo sweeps through its full range of motion without binding.',
          partIds: actuatorParts.filter(p => p.name.toLowerCase().includes('servo') || p.name.toLowerCase().includes('actuator')).map(p => p.id),
          tools: ['Python test script'],
        },
        {
          id: '3.6',
          title: 'Verify Vision Camera feed and Voice Output Speaker functionality',
          description: 'Test camera streaming and audio output to confirm both subsystems are operational.',
          partIds: [...sensorParts.filter(p => p.name.toLowerCase().includes('camera') || p.name.toLowerCase().includes('vision')).map(p => p.id), ...moduleParts.filter(p => p.name.toLowerCase().includes('speaker') || p.name.toLowerCase().includes('i2s')).map(p => p.id)],
          tools: ['Python test script', 'Speaker test audio'],
        },
      ],
    },
    {
      id: 'assemble',
      name: 'Assemble',
      icon: '🔧',
      steps: [
        {
          id: '4.1',
          title: 'Assemble the robot chassis using aluminum extrusions and corner brackets',
          description: 'Build the main frame using 2020 aluminum extrusions and T-slot brackets. Ensure the frame is square before tightening.',
          partIds: structural.filter(p => p.name.toLowerCase().includes('extrusion') || p.name.toLowerCase().includes('bracket') || p.name.toLowerCase().includes('frame')).map(p => p.id),
          tools: ['M4 hex key', 'M4 T-nut', 'Torque wrench', 'Square ruler'],
        },
        {
          id: '4.2',
          title: 'Mount the Robot Base Plate and caster wheels to the chassis',
          description: 'Attach the base plate and install caster wheels at the front and/or rear of the robot.',
          partIds: structural.filter(p => p.name.toLowerCase().includes('plate') || p.name.toLowerCase().includes('base') || p.name.toLowerCase().includes('caster') || p.name.toLowerCase().includes('wheel')).map(p => p.id),
          tools: ['M4 hex key', 'Screwdriver'],
        },
        {
          id: '4.3',
          title: 'Attach Stepper Motors and Drive Wheels to the chassis',
          description: 'Mount the motors using 3D printed mounts, then attach wheels with hub adapters. Check shaft alignment.',
          partIds: [...actuatorParts.filter(p => p.name.toLowerCase().includes('motor') || p.name.toLowerCase().includes('nema') || p.name.toLowerCase().includes('wheel') || p.name.toLowerCase().includes('hub')).map(p => p.id), ...structural.filter(p => p.name.toLowerCase().includes('mount') || p.name.toLowerCase().includes('adapter')).map(p => p.id)],
          tools: ['M3 hex key', 'M3 bolts', 'Locktite (optional)'],
        },
        {
          id: '4.4',
          title: 'Mount the Ultrasonic Sensor and Camera to the front frame',
          description: 'Install the ultrasonic sensor and vision camera at their designated positions on the front of the robot.',
          partIds: [...sensorParts.filter(p => p.name.toLowerCase().includes('ultrasonic') || p.name.toLowerCase().includes('camera') || p.name.toLowerCase().includes('vision') || p.name.toLowerCase().includes('sensor')).map(p => p.id), ...structural.filter(p => p.name.toLowerCase().includes('sensor') || p.name.toLowerCase().includes('camera') || p.name.toLowerCase().includes('mount')).map(p => p.id)],
          tools: ['M3 bolts', 'Double-sided tape', 'Cable ties'],
        },
        {
          id: '4.5',
          title: 'Mount the L298N Motor Driver, Raspberry Pi, Speaker, and LiPo Battery Holder',
          description: 'Install all major components on the frame. Route cables cleanly to avoid interference with moving parts.',
          partIds: [...mcuParts.map(p => p.id), ...moduleParts.filter(p => p.name.toLowerCase().includes('driver') || p.name.toLowerCase().includes('speaker') || p.name.toLowerCase().includes('i2s')).map(p => p.id), ...powerParts.filter(p => p.name.toLowerCase().includes('battery') || p.name.toLowerCase().includes('holder')).map(p => p.id), ...structural.filter(p => p.name.toLowerCase().includes('mount') || p.name.toLowerCase().includes('holder')).map(p => p.id)],
          tools: ['M3 bolts', 'Standoffs', 'Cable ties', 'Cable clips'],
        },
        {
          id: '4.6',
          title: 'Assemble and attach the Lid Actuator Servo and linkage to the Refuse Container',
          description: 'Mount the servo and connect the linkage to the container lid. Test open/close operation.',
          partIds: [...actuatorParts.filter(p => p.name.toLowerCase().includes('servo') || p.name.toLowerCase().includes('actuator') || p.name.toLowerCase().includes('lid')).map(p => p.id), ...structural.filter(p => p.name.toLowerCase().includes('container') || p.name.toLowerCase().includes('refuse') || p.name.toLowerCase().includes('lid') || p.name.toLowerCase().includes('linkage')).map(p => p.id)],
          tools: ['M3 bolts', 'Screwdriver', 'Hot glue'],
        },
        {
          id: '4.7',
          title: 'Attach external shell panels to the robot frame',
          description: 'Install all remaining enclosure panels. Ensure all connectors are accessible for future maintenance.',
          partIds: structural.filter(p => p.name.toLowerCase().includes('shell') || p.name.toLowerCase().includes('panel') || p.name.toLowerCase().includes('enclosure')).map(p => p.id),
          tools: ['M4 bolts', 'Hex key', 'Snap rivets'],
        },
      ],
    },
  ]
}

const TOOLS_DEFAULT = [
  '3D printer (PETG and PLA capable)',
  'M4 hex key',
  'M3 hex key',
  'Wire strippers',
  'Small Phillips head screwdriver',
  'Multimeter',
]

const ASSUMPTIONS_DEFAULT = [
  'Basic understanding of Raspberry Pi GPIO',
  'Ability to configure Raspberry Pi OS',
  'Familiarity with 3D printing processes',
  'Knowledge of safe LiPo battery handling',
]

export default function InstructionsTab() {
  const { project } = useProjectStore()
  const [doneSteps, setDoneSteps] = useState<Record<string, boolean>>({})

  if (!project) {
    return <div className="p-8 text-[var(--c-g600)]">Loading...</div>
  }

  const phases = autoGeneratePhases(project.name, project.parts)
  const totalSteps = phases.reduce((sum, p) => sum + p.steps.length, 0)
  const doneCount = Object.values(doneSteps).filter(Boolean).length

  const toggleStep = (stepId: string) => {
    setDoneSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }))
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--c-bg)] border-b border-[var(--c-g800)] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Instructions</h2>
          <span className="text-xs px-2 py-0.5 bg-[var(--c-g800)] text-[var(--c-g400)] rounded-full">
            {doneCount}/{totalSteps} Done
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-[10px] font-bold border border-[var(--c-g700)] text-[var(--c-g400)] rounded-lg hover:border-[var(--c-g500)] hover:text-white transition-colors">
            Regenerate
          </button>
          <button className="px-3 py-1.5 text-[10px] font-bold bg-[var(--c-accent)] text-black rounded-lg hover:opacity-90 transition-opacity">
            Generate All ({totalSteps})
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Tools & Assumptions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-[var(--c-g800)] rounded-xl p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>🔧</span> Tools
            </h3>
            <ul className="space-y-1.5">
              {TOOLS_DEFAULT.map((tool) => (
                <li key={tool} className="flex items-start gap-2 text-xs text-[var(--c-g400)]">
                  <span className="text-[var(--c-g600)] mt-0.5">•</span>
                  {tool}
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-[var(--c-g800)] rounded-xl p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>📋</span> Assumptions
            </h3>
            <ul className="space-y-1.5">
              {ASSUMPTIONS_DEFAULT.map((a) => (
                <li key={a} className="flex items-start gap-2 text-xs text-[var(--c-g400)]">
                  <span className="text-[var(--c-g600)] mt-0.5">-</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Phases */}
        {phases.map((phase) => {
          const phaseDone = phase.steps.filter(s => doneSteps[s.id]).length
          return (
            <div key={phase.id} className="space-y-3">
              {/* Phase header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{phase.icon}</span>
                  <h3 className="text-base font-bold text-white">{phase.name}</h3>
                  <span className="text-xs px-2 py-0.5 bg-[var(--c-g800)] text-[var(--c-g500)] rounded-full">
                    {phaseDone}/{phase.steps.length}
                  </span>
                </div>
                <button className="px-3 py-1 text-[10px] font-bold border border-[var(--c-g700)] text-[var(--c-g500)] rounded-lg hover:border-[var(--c-g500)] hover:text-white transition-colors">
                  Generate ({phase.steps.length})
                </button>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                {phase.steps.map((step) => {
                  const isDone = doneSteps[step.id]
                  const partObjs = step.partIds.map(id => project.parts.find(p => p.id === id)).filter(Boolean)
                  return (
                    <div
                      key={step.id}
                      className={`border rounded-xl p-4 transition-colors ${
                        isDone
                          ? 'border-[var(--c-g700)] bg-[var(--c-g950)] opacity-60'
                          : 'border-[var(--c-g800)] hover:border-[var(--c-g700)] bg-[var(--c-bg)]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleStep(step.id)}
                          className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isDone
                              ? 'bg-[var(--c-accent)] border-[var(--c-accent)]'
                              : 'border-[var(--c-g600)] hover:border-[var(--c-g400)]'
                          }`}
                        >
                          {isDone && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5l2 2 4-4" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h4 className={`text-sm font-semibold leading-tight ${isDone ? 'line-through text-[var(--c-g600)]' : 'text-white'}`}>
                              {step.id}. {step.title}
                            </h4>
                            {partObjs.length > 0 && (
                              <span className="text-[10px] text-[var(--c-g600)] shrink-0 mt-0.5">
                                {partObjs.length} parts
                              </span>
                            )}
                          </div>
                          <p className={`text-xs leading-relaxed ${isDone ? 'text-[var(--c-g700)]' : 'text-[var(--c-g500)]'}`}>
                            {step.description}
                          </p>
                          {partObjs.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {partObjs.slice(0, 6).map((part) => part && (
                                <span
                                  key={part.id}
                                  className="text-[10px] px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: `${getCategoryColor(part.category)}15`,
                                    color: getCategoryColor(part.category),
                                  }}
                                >
                                  {part.name}
                                </span>
                              ))}
                              {partObjs.length > 6 && (
                                <span className="text-[10px] text-[var(--c-g600)] px-1.5 py-0.5">
                                  +{partObjs.length - 6} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
