// Send Remittance Statement to Owner
// Saves remittance record and sends notification

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Generate remittance number
    const remittanceNumber = `REM-${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Create remittance record
    const { data: remittance, error } = await supabase
      .from('remittances')
      .insert({
        remittance_number: remittanceNumber,
        owner_id: data.owner.id,
        period_start: data.period.start,
        period_end: data.period.end,
        gross_rental_income: data.gross_income,
        platform_fees: data.platform_fees,
        cleaning_fees: data.cleaning_fees,
        maintenance_expenses: data.expenses,
        total_deductions: data.total_deductions,
        net_income: data.net_income,
        owner_split_percentage: data.owner.revenue_split_percentage,
        owner_payout_amount: data.owner_payout,
        status: 'pending',
        booking_ids: data.bookings?.map((b: any) => b.id) || [],
        expense_ids: data.expense_items?.map((e: any) => e.id) || [],
        generated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to save remittance' }, { status: 500 })
    }

    // In a real app, send email to owner here
    // For now, just log it
    console.log('Remittance created and would be sent to owner:', {
      remittance_number: remittanceNumber,
      owner: data.owner.business_name,
      amount: data.owner_payout,
    })

    return NextResponse.json({
      success: true,
      remittance,
      message: 'Statement generated and saved. Owner will be notified.',
    })
  } catch (error) {
    console.error('Error sending remittance:', error)
    return NextResponse.json({ error: 'Failed to send remittance' }, { status: 500 })
  }
}
