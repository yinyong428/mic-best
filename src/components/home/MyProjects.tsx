'use client'

import Link from 'next/link'
import { mockProject } from '@/lib/mockData'

export default function MyProjects() {
  // In real app, this would check auth and fetch user's projects
  const myProjects = [mockProject]

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-6">My Projects</h2>

      {myProjects.length > 0 ? (
        <div className="space-y-3">
          {myProjects.map((project) => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className="group block border border-[var(--c-g700)] hover:border-[var(--c-g500)] transition-all"
            >
              <div className="p-4 flex items-center gap-4">
                {/* Preview */}
                <div className="w-20 h-14 bg-[var(--c-g900)] flex items-center justify-center shrink-0">
                  <span className="text-2xl opacity-50">🤖</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase bg-[var(--c-accent)] text-black px-2 py-0.5">
                      Published
                    </span>
                    <h3 className="font-bold truncate">{project.name}</h3>
                  </div>
                  <p className="text-xs text-[var(--c-g500)] line-clamp-1">
                    {project.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">{project.parts.length} parts</p>
                  <p className="text-xs text-[var(--c-g600)]">
                    Today
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-[var(--c-g700)] rounded-lg p-12 text-center">
          <p className="text-[var(--c-g500)] mb-4">No projects yet</p>
          <button className="btn-primary text-sm">Start Your First Project</button>
        </div>
      )}
    </section>
  )
}
