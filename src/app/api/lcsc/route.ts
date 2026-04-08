import { NextRequest, NextResponse } from 'next/server'
import { searchLCSC, type LCSCPart } from '@/lib/lcsc'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') ?? ''
  const category = searchParams.get('category') ?? undefined

  if (!query.trim() && !category) {
    return NextResponse.json(
      { error: 'Query parameter "q" or "category" is required' },
      { status: 400 }
    )
  }

  try {
    const parts: LCSCPart[] = searchLCSC(query, category)

    return NextResponse.json({
      success: true,
      query,
      category: category ?? 'all',
      count: parts.length,
      parts,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
