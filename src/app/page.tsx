'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import HeroSection from '@/components/home/HeroSection'
import CommunityProjects from '@/components/home/CommunityProjects'
import MyProjects from '@/components/home/MyProjects'
import { mockUser } from '@/lib/mockData'

export default function HomePage() {
  const [showIdeas, setShowIdeas] = useState(false)

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar user={mockUser} />

      <main className="flex-1">
        {/* Hero + AI Input */}
        <HeroSection showIdeas={showIdeas} onToggleIdeas={() => setShowIdeas(!showIdeas)} />

        {/* Community Projects */}
        <CommunityProjects />

        {/* My Projects */}
        <MyProjects />

        {/* Footer */}
        <footer className="border-t border-[var(--c-g800)] py-6 px-4 text-center text-sm text-[var(--c-g500)]">
          <p>
            Built by 3E8 Robotics |{' '}
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}
