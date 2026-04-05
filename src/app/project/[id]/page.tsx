'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useProjectStore } from '@/stores/projectStore'
import { useUserStore } from '@/stores/userStore'
import { mockProject, mockUser } from '@/lib/mockData'
import Navbar from '@/components/layout/Navbar'
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
  const { activeTab, setProject } = useProjectStore()
  const { setUser } = useUserStore()

  useEffect(() => {
    // Load mock project and user
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
      <Navbar user={mockUser} />
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
