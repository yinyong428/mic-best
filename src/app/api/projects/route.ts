import { NextResponse } from 'next/server'

// Mock data - in real app, this would query Supabase
const projects = [
  {
    id: 'project-1',
    name: 'Garbage Robot',
    description: 'Autonomous refuse bot with ultrasonic sensor and vision camera.',
    status: 'published',
    author: 'olly',
    parts: [],
    totalCost: 311.15,
  },
]

export async function GET() {
  return NextResponse.json(projects)
}

export async function POST(request: Request) {
  const body = await request.json()

  // In real app, this would create a project in Supabase
  const newProject = {
    id: `project-${Date.now()}`,
    ...body,
    status: 'draft',
    createdAt: new Date().toISOString(),
  }

  return NextResponse.json(newProject, { status: 201 })
}
