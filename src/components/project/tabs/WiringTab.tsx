'use client'

export default function WiringTab() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      {/* Placeholder for React Flow wiring diagram */}
      <div className="max-w-md space-y-4">
        <div className="w-24 h-24 mx-auto bg-[var(--c-g800)] rounded-full flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--c-g500)]"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M11 9h4a2 2 0 0 0 2-2V3" />
            <circle cx="9" cy="9" r="2" />
            <path d="M7 21v-4a2 2 0 0 1 2-2h4" />
            <circle cx="15" cy="15" r="2" />
          </svg>
        </div>
        <h2 className="text-xl font-bold">Wiring Diagram</h2>
        <p className="text-[var(--c-g500)] text-sm">
          React Flow 接线图将显示在这里，包含节点类型化（MCU / Sensor / Actuator /
          Power / Module）和完整的接线连接。
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-4">
          {[
            { label: 'MCU', color: '#3b82f6' },
            { label: 'Sensor', color: '#22c55e' },
            { label: 'Actuator', color: '#f59e0b' },
            { label: 'Power', color: '#ef4444' },
            { label: 'Module', color: '#8b5cf6' },
          ].map((type) => (
            <span
              key={type.label}
              className="px-3 py-1 text-xs font-bold rounded-full"
              style={{ backgroundColor: `${type.color}20`, color: type.color }}
            >
              {type.label}
            </span>
          ))}
        </div>
        <p className="text-xs text-[var(--c-g600)] pt-4">
          功能包括：缩放、平移、节点拖拽、连线编辑、引脚详情悬停
        </p>
      </div>
    </div>
  )
}
