import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/projects — list user's projects
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')

  if (!userId) {
    // Return mock data for unauthenticated requests (dev mode)
    return NextResponse.json([])
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[projects GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/projects — create new project
export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, description, parts, image_url, total_cost } = body

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: name ?? 'Untitled Project',
      description: description ?? '',
      parts: parts ?? [],
      image_url: image_url ?? null,
      total_cost: total_cost ?? 0,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    console.error('[projects POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
