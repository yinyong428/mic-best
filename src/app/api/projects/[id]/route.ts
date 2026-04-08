import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/projects/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = req.headers.get('x-user-id')
  const client = createServerClient()

  if (!client) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Security: ensure user owns the project (unless it's their own read)
  if (userId && data.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(data)
}

// PATCH /api/projects/[id] — update project
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = createServerClient()
  if (!client) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  const body = await req.json()

  // Only allow updating own projects
  const { data: existing } = await client
    .from('projects')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existing || existing.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const allowedFields = [
    'name', 'description', 'status', 'parts', 'wiring_nodes',
    'wiring_edges', 'instructions', 'image_url', 'total_cost', 'tags',
  ]
  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field]
  }

  const { data, error } = await client
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[projects PATCH]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE /api/projects/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = createServerClient()
  if (!client) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  const { data: existing } = await client
    .from('projects')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existing || existing.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await client.from('projects').delete().eq('id', id)

  if (error) {
    console.error('[projects DELETE]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
