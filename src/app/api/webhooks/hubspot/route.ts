// HubSpot Webhook Handler
// Receives events from HubSpot and syncs to our database

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const events = await request.json()

    console.log('Received HubSpot webhook:', events)

    // Process each event
    for (const event of events) {
      const { subscriptionType, objectId, propertyName, propertyValue } = event

      // Handle contact creation/update
      if (subscriptionType === 'contact.creation' || subscriptionType === 'contact.propertyChange') {
        await handleContactEvent(event)
      }

      // Handle deal creation/update
      if (subscriptionType === 'deal.creation' || subscriptionType === 'deal.propertyChange') {
        await handleDealEvent(event)
      }

      // Handle ticket creation/update
      if (subscriptionType === 'ticket.creation' || subscriptionType === 'ticket.propertyChange') {
        await handleTicketEvent(event)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing HubSpot webhook:', error)
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}

// Handle contact events from HubSpot
async function handleContactEvent(event: any) {
  const { objectId } = event

  // Fetch full contact data from HubSpot
  const response = await fetch(
    `https://api.hubapi.com/crm/v3/objects/contacts/${objectId}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
      },
    }
  )

  const contactData = await response.json()
  const properties = contactData.properties

  console.log('Processing HubSpot contact:', properties)

  // Check if this contact exists in our database
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', properties.email)
    .single()

  if (!existingProfile) {
    // New contact from HubSpot - create in our system
    console.log('Creating new profile from HubSpot contact')

    // Note: We can't create auth users from webhook
    // This would require the user to sign up through our platform
    // For now, we just log it
    console.log('Contact needs to sign up on platform:', properties.email)

    return
  }

  // Update existing profile
  const updates: any = {}
  if (properties.firstname && properties.lastname) {
    updates.full_name = `${properties.firstname} ${properties.lastname}`
  }
  if (properties.phone) {
    updates.phone = properties.phone
  }

  if (Object.keys(updates).length > 0) {
    await supabase
      .from('profiles')
      .update(updates)
      .eq('id', existingProfile.id)

    console.log('Updated profile from HubSpot:', existingProfile.id)
  }

  // If it's an owner, update owner record
  if (properties.user_role === 'owner') {
    const { data: owner } = await supabase
      .from('owners')
      .select('id')
      .eq('user_id', existingProfile.id)
      .single()

    if (owner) {
      const ownerUpdates: any = {}
      if (properties.company) {
        ownerUpdates.business_name = properties.company
      }

      if (Object.keys(ownerUpdates).length > 0) {
        await supabase
          .from('owners')
          .update(ownerUpdates)
          .eq('id', owner.id)

        console.log('Updated owner from HubSpot:', owner.id)
      }
    }
  }
}

// Handle deal events from HubSpot
async function handleDealEvent(event: any) {
  const { objectId } = event

  // Fetch full deal data
  const response = await fetch(
    `https://api.hubapi.com/crm/v3/objects/deals/${objectId}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
      },
    }
  )

  const dealData = await response.json()
  const properties = dealData.properties

  console.log('Processing HubSpot deal:', properties)

  // Try to find matching booking by deal name (which includes booking_number)
  const bookingNumber = properties.dealname?.match(/BK-\d+-\d+/)?.[0]

  if (bookingNumber) {
    const { data: booking } = await supabase
      .from('bookings')
      .select('id')
      .eq('booking_number', bookingNumber)
      .single()

    if (booking) {
      // Update booking status based on deal stage
      const status = mapDealStageToBookingStatus(properties.dealstage)

      await supabase
        .from('bookings')
        .update({ status })
        .eq('id', booking.id)

      console.log('Updated booking from HubSpot deal:', booking.id)
    }
  }
}

// Handle ticket events from HubSpot
async function handleTicketEvent(event: any) {
  const { objectId } = event

  // Fetch full ticket data
  const response = await fetch(
    `https://api.hubapi.com/crm/v3/objects/tickets/${objectId}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
      },
    }
  )

  const ticketData = await response.json()
  const properties = ticketData.properties

  console.log('Processing HubSpot ticket:', properties)

  // Try to find matching maintenance request by ticket number or subject
  // This is a simple implementation - you might want to store HubSpot IDs
  const { data: maintenance } = await supabase
    .from('maintenance_requests')
    .select('id')
    .eq('title', properties.subject)
    .single()

  if (maintenance) {
    // Update maintenance status based on ticket stage
    const status = mapTicketStageToMaintenanceStatus(properties.hs_pipeline_stage)

    await supabase
      .from('maintenance_requests')
      .update({ status })
      .eq('id', maintenance.id)

    console.log('Updated maintenance from HubSpot ticket:', maintenance.id)
  }
}

// Mapping functions
function mapDealStageToBookingStatus(dealStage: string): string {
  const stageMap: Record<string, string> = {
    'appointmentscheduled': 'inquiry',
    'qualifiedtobuy': 'confirmed',
    'presentationscheduled': 'checked_in',
    'decisionmakerboughtin': 'active',
    'closedwon': 'completed',
    'closedlost': 'cancelled',
  }

  return stageMap[dealStage] || 'inquiry'
}

function mapTicketStageToMaintenanceStatus(ticketStage: string): string {
  const stageMap: Record<string, string> = {
    '1': 'requested',
    '2': 'scheduled',
    '3': 'in_progress',
    '4': 'completed',
    '5': 'cancelled',
  }

  return stageMap[ticketStage] || 'requested'
}
