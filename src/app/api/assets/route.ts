// Assets (RVs) CRUD API
// Create, Read, Update, Delete RVs with HubSpot sync

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET all assets
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const ownerId = searchParams.get('owner_id')

    let query = supabase
      .from('assets')
      .select('*, owners(business_name)')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (ownerId) {
      query = query.eq('owner_id', ownerId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assets: data })
  } catch (error) {
    console.error('Error fetching assets:', error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}

// POST create new asset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data: asset, error } = await supabase
      .from('assets')
      .insert({
        owner_id: body.owner_id,
        name: body.name,
        description: body.description,
        year: body.year,
        make: body.make,
        model: body.model,
        rv_type: body.rv_type,
        vin: body.vin,
        license_plate: body.license_plate,
        length_feet: body.length_feet,
        weight_lbs: body.weight_lbs,
        sleeps: body.sleeps,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        fuel_type: body.fuel_type,
        transmission: body.transmission,
        features: body.features,
        amenities: body.amenities,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,
        base_price_per_night: body.base_price_per_night,
        cleaning_fee: body.cleaning_fee || 75,
        security_deposit: body.security_deposit || 500,
        minimum_rental_nights: body.minimum_rental_nights || 2,
        status: body.status || 'pending_approval',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sync to HubSpot (update owner contact with new asset info)
    try {
      await fetch(`${request.nextUrl.origin}/api/sync/hubspot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'owner', id: body.owner_id }),
      })
    } catch (hubspotError) {
      console.error('HubSpot sync failed:', hubspotError)
      // Continue anyway - asset was created
    }

    return NextResponse.json({ success: true, asset }, { status: 201 })
  } catch (error) {
    console.error('Error creating asset:', error)
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
  }
}

// PATCH update asset
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    const { data: asset, error } = await supabase
      .from('assets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, asset })
  } catch (error) {
    console.error('Error updating asset:', error)
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
  }
}

// DELETE asset
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting asset:', error)
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
  }
}
