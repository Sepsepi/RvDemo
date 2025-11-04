// HubSpot API Client
// Full integration with contacts, deals, and webhooks

const HUBSPOT_API_URL = 'https://api.hubapi.com'
const ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN

interface HubSpotContact {
  email: string
  firstname?: string
  lastname?: string
  phone?: string
  company?: string
  user_role?: string
  [key: string]: any
}

interface HubSpotDeal {
  dealname: string
  amount: number
  dealstage: string
  closedate?: string
  [key: string]: any
}

export class HubSpotClient {
  private headers = {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  }

  // ============================================
  // CONTACTS
  // ============================================

  async createContact(contact: HubSpotContact) {
    const response = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        properties: contact,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`HubSpot API Error: ${error.message}`)
    }

    return response.json()
  }

  async updateContact(contactId: string, properties: Record<string, any>) {
    const response = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify({
        properties,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`HubSpot API Error: ${error.message}`)
    }

    return response.json()
  }

  async getContactByEmail(email: string) {
    const response = await fetch(
      `${HUBSPOT_API_URL}/crm/v3/objects/contacts/search`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email,
                },
              ],
            },
          ],
        }),
      }
    )

    const data = await response.json()
    return data.results?.[0] || null
  }

  async getAllContacts(limit = 100) {
    const response = await fetch(
      `${HUBSPOT_API_URL}/crm/v3/objects/contacts?limit=${limit}`,
      {
        headers: this.headers,
      }
    )

    return response.json()
  }

  // ============================================
  // DEALS
  // ============================================

  async createDeal(deal: HubSpotDeal) {
    const response = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/deals`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        properties: deal,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`HubSpot API Error: ${error.message}`)
    }

    return response.json()
  }

  async updateDeal(dealId: string, properties: Record<string, any>) {
    const response = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/deals/${dealId}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify({
        properties,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`HubSpot API Error: ${error.message}`)
    }

    return response.json()
  }

  async associateContactWithDeal(contactId: string, dealId: string) {
    const response = await fetch(
      `${HUBSPOT_API_URL}/crm/v3/objects/deals/${dealId}/associations/contacts/${contactId}/deal_to_contact`,
      {
        method: 'PUT',
        headers: this.headers,
      }
    )

    return response.json()
  }

  // ============================================
  // TICKETS (for maintenance requests)
  // ============================================

  async createTicket(ticket: {
    subject: string
    content: string
    hs_pipeline_stage: string
    hs_ticket_priority?: string
  }) {
    const response = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/tickets`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        properties: ticket,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`HubSpot API Error: ${error.message}`)
    }

    return response.json()
  }

  async updateTicket(ticketId: string, properties: Record<string, any>) {
    const response = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify({
        properties,
      }),
    })

    return response.json()
  }

  // ============================================
  // WEBHOOKS
  // ============================================

  async getWebhookSettings() {
    const response = await fetch(`${HUBSPOT_API_URL}/webhooks/v3/subscriptions`, {
      headers: this.headers,
    })

    return response.json()
  }

  async createWebhook(subscription: {
    eventType: string
    propertyName?: string
    active: boolean
  }) {
    const response = await fetch(`${HUBSPOT_API_URL}/webhooks/v3/subscriptions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(subscription),
    })

    return response.json()
  }
}

// Export singleton instance
export const hubspot = new HubSpotClient()

// ============================================
// SYNC FUNCTIONS
// ============================================

// Sync owner to HubSpot contact
export async function syncOwnerToHubSpot(owner: any, userProfile: any) {
  try {
    const contact: HubSpotContact = {
      email: userProfile.email,
      firstname: userProfile.full_name?.split(' ')[0] || '',
      lastname: userProfile.full_name?.split(' ').slice(1).join(' ') || '',
      phone: userProfile.phone || '',
      company: owner.business_name || '',
      user_role: 'owner',
      revenue_split: owner.revenue_split_percentage?.toString() || '',
      contract_type: owner.contract_type || 'standard',
    }

    // Check if contact exists
    const existingContact = await hubspot.getContactByEmail(userProfile.email)

    if (existingContact) {
      // Update existing
      return await hubspot.updateContact(existingContact.id, contact)
    } else {
      // Create new
      return await hubspot.createContact(contact)
    }
  } catch (error) {
    console.error('Error syncing owner to HubSpot:', error)
    throw error
  }
}

// Sync booking to HubSpot deal
export async function syncBookingToHubSpot(booking: any, asset: any, renter: any) {
  try {
    const deal: HubSpotDeal = {
      dealname: `${booking.booking_number} - ${asset.name}`,
      amount: Number(booking.total_amount),
      dealstage: mapBookingStatusToDealStage(booking.status),
      closedate: new Date(booking.end_date).getTime().toString(),
      rv_type: asset.rv_type,
      rental_nights: booking.total_nights,
    }

    const createdDeal = await hubspot.createDeal(deal)

    // Associate with renter contact if exists
    if (renter?.user_id) {
      const renterContact = await hubspot.getContactByEmail(renter.email)
      if (renterContact) {
        await hubspot.associateContactWithDeal(renterContact.id, createdDeal.id)
      }
    }

    return createdDeal
  } catch (error) {
    console.error('Error syncing booking to HubSpot:', error)
    throw error
  }
}

// Sync maintenance request to HubSpot ticket
export async function syncMaintenanceToHubSpot(maintenance: any, asset: any) {
  try {
    const ticket = {
      subject: maintenance.title,
      content: maintenance.description,
      hs_pipeline_stage: mapMaintenanceStatusToTicketStage(maintenance.status),
      hs_ticket_priority: maintenance.priority || 'MEDIUM',
      asset_name: asset.name,
      estimated_cost: maintenance.estimated_cost?.toString() || '0',
    }

    return await hubspot.createTicket(ticket)
  } catch (error) {
    console.error('Error syncing maintenance to HubSpot:', error)
    throw error
  }
}

// ============================================
// MAPPING FUNCTIONS
// ============================================

function mapBookingStatusToDealStage(status: string): string {
  const stageMap: Record<string, string> = {
    inquiry: 'appointmentscheduled',
    confirmed: 'qualifiedtobuy',
    checked_in: 'presentationscheduled',
    active: 'decisionmakerboughtin',
    checked_out: 'closedwon',
    completed: 'closedwon',
    cancelled: 'closedlost',
  }

  return stageMap[status] || 'appointmentscheduled'
}

function mapMaintenanceStatusToTicketStage(status: string): string {
  const stageMap: Record<string, string> = {
    requested: '1',
    scheduled: '2',
    in_progress: '3',
    completed: '4',
    cancelled: '5',
  }

  return stageMap[status] || '1'
}
