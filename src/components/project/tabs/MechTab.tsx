'use client'

export default function MechTab() {
  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-[var(--c-g800)] flex items-center justify-between">
        <h2 className="font-bold">MECH</h2>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs">旋转</button>
          <button className="btn-secondary text-xs">爆炸</button>
          <button className="btn-secondary text-xs">重置</button>
        </div>
      </div>

      {/* 3D Viewport placeholder */}
      <div className="flex-1 flex items-center justify-center bg-[var(--c-g950)]">
        <div className="max-w-md text-center space-y-4">
          <div className="w-32 h-32 mx-auto bg-[var(--c-g800)] rounded-3xl flex items-center justify-center">
            <span className="text-5xl">🤖</span>
          </div>
          <h3 className="font-bold">3D 爆炸图</h3>
          <p className="text-sm text-[var(--c-g500)]">
            Three.js 3D 可视化将显示在这里，展示所有零件的装配位置和爆炸视图。
          </p>
          <div className="text-xs text-[var(--c-g600)] space-y-1 pt-2">
            <p>• 点击零件高亮显示</p>
            <p>• 鼠标拖拽旋转视角</p>
            <p>• 滚轮缩放</p>
            <p>• 爆炸视图显示装配顺序</p>
          </div>
        </div>
      </div>
    </div>
  )
}
