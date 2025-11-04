// Single Owner API

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { data: owner, error } = await supabase
      .from('owners')
      .select('*, profiles(id, full_name, email)')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
    }

    return NextResponse.json({ owner })
  } catch (error) {
    console.error('Error fetching owner:', error)
    return NextResponse.json({ error: 'Failed to fetch owner' }, { status: 500 })
  }
}
