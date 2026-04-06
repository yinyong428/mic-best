'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useProjectStore } from '@/stores/projectStore'
import { useUserStore } from '@/stores/userStore'
import { mockProject, mockUser } from '@/lib/mockData'
import ProjectHeader from '@/components/project/ProjectHeader'
import PartsList from '@/components/project/PartsList'
import ChatPanel from '@/components/project/ChatPanel'
import InfoTab from '@/components/project/tabs/InfoTab'
import BomTab from '@/components/project/tabs/BomTab'
import WiringTab from '@/components/project/tabs/WiringTab'
import MechTab from '@/components/project/tabs/MechTab'
import InstructionsTab from '@/components/project/tabs/InstructionsTab'
import PartTab from '@/components/project/tabs/PartTab'

export default function ProjectPage() {
  const params = useParams()
  const { activeTab, setProject, setProjectImage, project } = useProjectStore()
  const { setUser } = useUserStore()

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('mic_best_last_project') ?? '{}')
      if (saved.bomResult) {
        const parts = (saved.bomResult.items ?? []).map((item: any, i: number) => ({
          id: `part-${i}`,
          name: item.name,
          category: (item.category ?? 'misc').toLowerCase().includes('mcu') ? 'mcu'
            : (item.category ?? '').toLowerCase().includes('sensor') ? 'sensor'
            : (item.category ?? '').toLowerCase().includes('actuator') ? 'actuator'
            : (item.category ?? '').toLowerCase().includes('power') ? 'power'
            : (item.category ?? '').toLowerCase().includes('module') ? 'module'
            : (item.category ?? '').toLowerCase().includes('外壳') || (item.category ?? '').toLowerCase().includes('enclosure') ? 'enclosure'
            : 'structural',
          model: item.partNumber ?? item.name,
          description: item.description ?? '',
          qty: item.quantity ?? 1,
          unitCost: item.unitCost ?? 0,
          lcscId: item.lcscId ?? '',
          hqPartNumber: item.hqPartNumber ?? '',
        }))
        const projectData = {
          id: `project-${saved.projectName}`,
          name: saved.bomResult.projectName ?? saved.projectName ?? 'Untitled',
          description: saved.bomResult.description ?? '',
          parts,
          totalCost: saved.bomResult.totalCost ?? 0,
          status: 'draft' as const,
          author: 'olly',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          imageUrl: saved.imageUrl ?? '',
        }
        setProject(projectData)
        if (saved.imageUrl) setProjectImage(saved.imageUrl)
        setUser(mockUser)
        return
      }
    } catch {}
    setProject(mockProject)
    setUser(mockUser)
  }, [setProject, setUser])

  const renderTab = () => {
    switch (activeTab) {
      case 'info':
        return <InfoTab />
      case 'bom':
        return <BomTab />
      case 'wiring':
        return <WiringTab />
      case 'mech':
        return <MechTab />
      case 'instructions':
        return <InstructionsTab />
      case 'part':
        return <PartTab />
      default:
        return <InfoTab />
    }
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <ProjectHeader />

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Parts list */}
        <PartsList />

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-[var(--c-bg)]">
          {renderTab()}
        </main>

        {/* Right sidebar - Chat */}
        <ChatPanel />
      </div>
    </div>
  )
}
