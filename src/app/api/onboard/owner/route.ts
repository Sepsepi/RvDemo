// Owner Onboarding API
// Creates owner in Supabase AND syncs to HubSpot

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const HUBSPOT_API_URL = 'https://api.hubapi.com'
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    console.log('Received onboarding request:', data)

    // Step 1: Create HubSpot Contact
    const hubspotContact = await createHubSpotContact(data)
    console.log('Created HubSpot contact:', hubspotContact.id)

    // Step 2: Create owner in Supabase
    const { data: owner, error: ownerError } = await supabase
      .from('owners')
      .insert({
        business_name: data.businessName || `${data.firstName} ${data.lastName}`,
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zipCode,
        revenue_split_percentage: 70, // Default 70/30 split
        platform_fee_percentage: 10,
        contract_type: 'standard',
        status: 'pending_approval',
        notes: `Onboarded via form. Contact: ${data.email}, Phone: ${data.phone}. HubSpot ID: ${hubspotContact.id}`,
      })
      .select()
      .single()

    if (ownerError) {
      console.error('Error creating owner:', ownerError)
      return NextResponse.json({ error: 'Failed to create owner record' }, { status: 500 })
    }

    console.log('Created owner in Supabase:', owner.id)

    // Step 3: Create RV asset in Supabase
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        owner_id: owner.id,
        name: `${data.rvYear} ${data.rvMake} ${data.rvModel}`,
        year: parseInt(data.rvYear),
        make: data.rvMake,
        model: data.rvModel,
        rv_type: data.rvType,
        vin: data.vin,
        license_plate: data.licensePlate,
        length_feet: parseFloat(data.length),
        sleeps: parseInt(data.sleeps),
        base_price_per_night: parseFloat(data.basePrice),
        status: 'pending_approval',
        city: data.city,
        state: data.state,
        zip_code: data.zipCode,
        insurance_policy_number: data.policyNumber,
      })
      .select()
      .single()

    if (assetError) {
      console.error('Error creating asset:', assetError)
      return NextResponse.json({ error: 'Failed to create asset record' }, { status: 500 })
    }

    console.log('Created asset in Supabase:', asset.id)

    // Step 4: Create HubSpot Deal for the onboarding
    const hubspotDeal = await createHubSpotDeal(data, hubspotContact.id)
    console.log('Created HubSpot deal:', hubspotDeal.id)

    // Step 5: Send notification email (via HubSpot or your email service)
    await sendNotificationToTeam(data, owner, asset)

    return NextResponse.json({
      success: true,
      owner,
      asset,
      hubspot: {
        contactId: hubspotContact.id,
        dealId: hubspotDeal.id,
      },
    })
  } catch (error) {
    console.error('Error in onboarding:', error)
    return NextResponse.json(
      { error: 'An error occurred during onboarding' },
      { status: 500 }
    )
  }
}

// ============================================
// HUBSPOT FUNCTIONS
// ============================================

async function createHubSpotContact(data: any) {
  const response = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/contacts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        email: data.email,
        firstname: data.firstName,
        lastname: data.lastName,
        phone: data.phone,
        company: data.businessName || `${data.firstName} ${data.lastName}`,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zipCode,
        // Custom properties
        user_role: 'owner',
        onboarding_status: 'pending_review',
        rv_type: data.rvType,
        rv_year: data.rvYear,
        rv_make: data.rvMake,
        rv_model: data.rvModel,
        vin: data.vin,
        desired_price: data.basePrice,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`HubSpot API Error: ${JSON.stringify(error)}`)
  }

  return response.json()
}

async function createHubSpotDeal(data: any, contactId: string) {
  // Create the deal
  const dealResponse = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/deals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        dealname: `New Owner Onboarding - ${data.firstName} ${data.lastName} - ${data.rvYear} ${data.rvMake}`,
        amount: parseFloat(data.basePrice) * 30, // Estimated monthly revenue (30 days)
        dealstage: 'appointmentscheduled',
        pipeline: 'default',
        rv_type: data.rvType,
        vin: data.vin,
      },
    }),
  })

  if (!dealResponse.ok) {
    const error = await dealResponse.json()
    throw new Error(`HubSpot Deal Error: ${JSON.stringify(error)}`)
  }

  const deal = await dealResponse.json()

  // Associate deal with contact
  await fetch(
    `${HUBSPOT_API_URL}/crm/v4/objects/deals/${deal.id}/associations/contacts/${contactId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 3, // Deal to Contact association
        },
      ]),
    }
  )

  return deal
}

async function sendNotificationToTeam(data: any, owner: any, asset: any) {
  // In a real app, send email to team
  console.log('New owner onboarding:', {
    owner: owner.id,
    asset: asset.id,
    contact: data.email,
  })

  // You could use SendGrid, Resend, or HubSpot email here
  // For now, just log it
}
