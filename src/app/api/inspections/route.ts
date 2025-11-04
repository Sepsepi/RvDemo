// Inspections API
// Create check-in/check-out inspection records

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data: inspection, error } = await supabase
      .from('inspections')
      .insert({
        booking_id: body.booking_id,
        asset_id: body.asset_id,
        inspection_type: body.inspection_type,
        mileage: body.mileage,
        fuel_level: body.fuel_level,
        exterior_condition: body.exterior_condition,
        interior_condition: body.interior_condition,
        mechanical_condition: body.mechanical_condition,
        checklist_items: body.checklist_items,
        damages_found: body.damages_found || false,
        damage_description: body.damage_description,
        estimated_repair_cost: body.estimated_repair_cost,
        notes: body.notes,
        inspection_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If damages found, create damage report
    if (body.damages_found) {
      await supabase.from('damage_reports').insert({
        report_number: `DMG-${Date.now()}`,
        booking_id: body.booking_id,
        asset_id: body.asset_id,
        inspection_id: inspection.id,
        title: `Damage found during ${body.inspection_type}`,
        description: body.damage_description,
        severity: body.estimated_repair_cost > 500 ? 'major' : 'minor',
        discovery_date: new Date().toISOString().split('T')[0],
        estimated_repair_cost: body.estimated_repair_cost,
        status: 'reported',
      })
    }

    return NextResponse.json({ success: true, inspection }, { status: 201 })
  } catch (error) {
    console.error('Error creating inspection:', error)
    return NextResponse.json({ error: 'Failed to create inspection' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const bookingId = searchParams.get('booking_id')

    let query = supabase
      .from('inspections')
      .select('*, bookings(booking_number), assets(name)')
      .order('inspection_date', { ascending: false })

    if (bookingId) {
      query = query.eq('booking_id', bookingId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ inspections: data })
  } catch (error) {
    console.error('Error fetching inspections:', error)
    return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 })
  }
}
