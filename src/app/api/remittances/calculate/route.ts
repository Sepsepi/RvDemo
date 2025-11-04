// Remittance Calculation API
// Calculate owner payouts based on bookings and expenses

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { owner_id, period_start, period_end } = await request.json()

    if (!owner_id || !period_start || !period_end) {
      return NextResponse.json(
        { error: 'Owner ID, period start, and period end are required' },
        { status: 400 }
      )
    }

    // Get owner details
    const { data: owner } = await supabase
      .from('owners')
      .select('*')
      .eq('id', owner_id)
      .single()

    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
    }

    // Get bookings in period
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, assets(name)')
      .eq('owner_id', owner_id)
      .eq('status', 'completed')
      .gte('end_date', period_start)
      .lte('end_date', period_end)

    // Calculate gross income
    const gross_income = bookings?.reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0

    // Calculate platform fees (10%)
    const platform_fees = gross_income * 0.1

    // Calculate cleaning fees
    const cleaning_fees = bookings?.reduce((sum, b) => sum + Number(b.cleaning_fee || 0), 0) || 0

    // Get expenses in period
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('owner_id', owner_id)
      .eq('status', 'approved')
      .gte('expense_date', period_start)
      .lte('expense_date', period_end)

    const total_expenses = expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0

    // Calculate net income
    const total_deductions = platform_fees + cleaning_fees + total_expenses
    const net_income = gross_income - total_deductions

    // Calculate owner payout based on their split
    const owner_payout = net_income * (owner.revenue_split_percentage / 100)

    return NextResponse.json({
      owner: {
        id: owner.id,
        business_name: owner.business_name,
        revenue_split_percentage: owner.revenue_split_percentage,
      },
      period: {
        start: period_start,
        end: period_end,
      },
      gross_income,
      platform_fees,
      cleaning_fees,
      expenses: total_expenses,
      total_deductions,
      net_income,
      owner_payout,
      bookings_count: bookings?.length || 0,
      expenses_count: expenses?.length || 0,
      bookings: bookings?.map(b => ({
        id: b.id,
        booking_number: b.booking_number,
        asset_name: b.assets?.name,
        start_date: b.start_date,
        end_date: b.end_date,
        amount: b.total_amount,
      })),
      expense_items: expenses?.map(e => ({
        id: e.id,
        description: e.description,
        category: e.category,
        amount: e.amount,
        date: e.expense_date,
      })),
    })
  } catch (error) {
    console.error('Calculation error:', error)
    return NextResponse.json({ error: 'Calculation failed' }, { status: 500 })
  }
}
