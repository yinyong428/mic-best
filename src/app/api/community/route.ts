import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { communityProjects } from '@/lib/mockData'

export const dynamic = 'force-dynamic'

// GET /api/community — list public community projects
export async function GET() {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('community_projects')
        .select('*')
        .order('star_count', { ascending: false })
        .limit(50)

      if (!error && data && data.length > 0) {
        return NextResponse.json(data)
      }
    } catch (err) {
      console.warn('[community API] Supabase unavailable, using mock data:', err)
    }
  }

  // Fallback to mock data (dev mode)
  return NextResponse.json(communityProjects)
}
