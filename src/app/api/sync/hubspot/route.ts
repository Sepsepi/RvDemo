// Sync data FROM our platform TO HubSpot
// Called when users create/update data in our system

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { hubspot, syncOwnerToHubSpot, syncBookingToHubSpot, syncMaintenanceToHubSpot } from '@/lib/hubspot/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { type, id } = await request.json()

    console.log(`Syncing ${type} ${id} to HubSpot...`)

    switch (type) {
      case 'owner':
        return await syncOwner(id)
      case 'booking':
        return await syncBooking(id)
      case 'maintenance':
        return await syncMaintenance(id)
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

// Sync owner to HubSpot
async function syncOwner(ownerId: string) {
  const { data: owner } = await supabase
    .from('owners')
    .select('*, profiles(*)')
    .eq('id', ownerId)
    .single()

  if (!owner) {
    return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
  }

  const userProfile = owner.profiles

  const result = await syncOwnerToHubSpot(owner, userProfile)

  // Store HubSpot ID back in our database
  await supabase
    .from('owners')
    .update({ notes: `HubSpot Contact ID: ${result.id}` })
    .eq('id', ownerId)

  return NextResponse.json({ success: true, hubspotId: result.id })
}

// Sync booking to HubSpot
async function syncBooking(bookingId: string) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, assets(*), renters(*, profiles(*))')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const result = await syncBookingToHubSpot(booking, booking.assets, booking.renters)

  return NextResponse.json({ success: true, hubspotId: result.id })
}

// Sync maintenance to HubSpot
async function syncMaintenance(maintenanceId: string) {
  const { data: maintenance } = await supabase
    .from('maintenance_requests')
    .select('*, assets(*)')
    .eq('id', maintenanceId)
    .single()

  if (!maintenance) {
    return NextResponse.json({ error: 'Maintenance not found' }, { status: 404 })
  }

  const result = await syncMaintenanceToHubSpot(maintenance, maintenance.assets)

  return NextResponse.json({ success: true, hubspotId: result.id })
}

// Bulk sync all data
export async function GET(request: NextRequest) {
  try {
    const results = {
      owners: 0,
      bookings: 0,
      maintenance: 0,
    }

    // Sync all owners
    const { data: owners } = await supabase
      .from('owners')
      .select('*, profiles(*)')

    if (owners) {
      for (const owner of owners) {
        try {
          await syncOwnerToHubSpot(owner, owner.profiles)
          results.owners++
        } catch (error) {
          console.error('Failed to sync owner:', owner.id, error)
        }
      }
    }

    // Sync all bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, assets(*), renters(*, profiles(*))')
      .eq('status', 'active')

    if (bookings) {
      for (const booking of bookings) {
        try {
          await syncBookingToHubSpot(booking, booking.assets, booking.renters)
          results.bookings++
        } catch (error) {
          console.error('Failed to sync booking:', booking.id, error)
        }
      }
    }

    // Sync pending maintenance
    const { data: maintenance } = await supabase
      .from('maintenance_requests')
      .select('*, assets(*)')
      .in('status', ['requested', 'scheduled', 'in_progress'])

    if (maintenance) {
      for (const request of maintenance) {
        try {
          await syncMaintenanceToHubSpot(request, request.assets)
          results.maintenance++
        } catch (error) {
          console.error('Failed to sync maintenance:', request.id, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      synced: results,
    })
  } catch (error) {
    console.error('Bulk sync error:', error)
    return NextResponse.json({ error: 'Bulk sync failed' }, { status: 500 })
  }
}
