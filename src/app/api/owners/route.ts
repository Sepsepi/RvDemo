// Owners CRUD API

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('owners')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ owners: data })
  } catch (error) {
    console.error('Error fetching owners:', error)
    return NextResponse.json({ error: 'Failed to fetch owners' }, { status: 500 })
  }
}
