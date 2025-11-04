// Bookings CRUD API
// Create, Read, Update, Delete bookings with HubSpot deal sync

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { syncBookingToHubSpot } from '@/lib/hubspot/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET all bookings
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const assetId = searchParams.get('asset_id')
    const renterId = searchParams.get('renter_id')

    let query = supabase
      .from('bookings')
      .select('*, assets(name, rv_type), renters(*), owners(business_name)')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (assetId) {
      query = query.eq('asset_id', assetId)
    }

    if (renterId) {
      query = query.eq('renter_id', renterId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bookings: data })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

// POST create new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Calculate totals
    const subtotal = body.nightly_rate * body.total_nights
    const platform_fee = subtotal * 0.1
    const total = subtotal + (body.cleaning_fee || 0) + platform_fee

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        asset_id: body.asset_id,
        renter_id: body.renter_id,
        owner_id: body.owner_id,
        start_date: body.start_date,
        end_date: body.end_date,
        total_nights: body.total_nights,
        nightly_rate: body.nightly_rate,
        subtotal,
        cleaning_fee: body.cleaning_fee || 0,
        security_deposit: body.security_deposit || 0,
        platform_fee,
        total_amount: total,
        status: body.status || 'inquiry',
        special_requests: body.special_requests,
      })
      .select('*, assets(*), renters(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create transaction for rental income
    await supabase.from('transactions').insert({
      booking_id: booking.id,
      asset_id: booking.asset_id,
      owner_id: booking.owner_id,
      renter_id: booking.renter_id,
      transaction_type: 'rental_income',
      amount: total,
      description: `Rental income for booking ${booking.booking_number}`,
      status: 'pending',
      transaction_date: body.start_date,
    })

    // Sync to HubSpot as Deal
    try {
      await syncBookingToHubSpot(booking, booking.assets, booking.renters)
      console.log('Synced booking to HubSpot')
    } catch (hubspotError) {
      console.error('HubSpot sync failed:', hubspotError)
      // Continue anyway - booking was created
    }

    return NextResponse.json({ success: true, booking }, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}

// PATCH update booking
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    const { data: booking, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select('*, assets(*), renters(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If status changed to completed, update transaction status
    if (updates.status === 'completed') {
      await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('booking_id', id)
        .eq('transaction_type', 'rental_income')
    }

    // Sync status change to HubSpot
    if (updates.status) {
      try {
        await syncBookingToHubSpot(booking, booking.assets, booking.renters)
      } catch (hubspotError) {
        console.error('HubSpot sync failed:', hubspotError)
      }
    }

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}

// DELETE booking
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
    }

    // Soft delete - mark as cancelled instead of deleting
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 })
  }
}
