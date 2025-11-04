// Expenses CRUD API
// Create, Approve, Update, Delete expenses

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET all expenses
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const assetId = searchParams.get('asset_id')
    const ownerId = searchParams.get('owner_id')

    let query = supabase
      .from('expenses')
      .select('*, assets(name), owners(business_name), maintenance_requests(ticket_number)')
      .order('expense_date', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (assetId) {
      query = query.eq('asset_id', assetId)
    }

    if (ownerId) {
      query = query.eq('owner_id', ownerId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ expenses: data })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

// POST create new expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        asset_id: body.asset_id,
        owner_id: body.owner_id,
        maintenance_request_id: body.maintenance_request_id,
        category: body.category,
        amount: body.amount,
        description: body.description,
        vendor: body.vendor,
        status: body.status || 'pending',
        expense_date: body.expense_date || new Date().toISOString().split('T')[0],
        receipt_url: body.receipt_url,
        deduct_from_owner: body.deduct_from_owner !== false,
        owner_responsible_percentage: body.owner_responsible_percentage || 100,
      })
      .select('*, assets(name), owners(business_name)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, expense }, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}

// PATCH update/approve expense
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    // If approving, set approved timestamp
    if (updates.status === 'approved') {
      updates.approved_at = new Date().toISOString()
    }

    const { data: expense, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select('*, assets(name), owners(business_name)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If approved, create transaction
    if (updates.status === 'approved') {
      await supabase.from('transactions').insert({
        asset_id: expense.asset_id,
        owner_id: expense.owner_id,
        transaction_type: expense.category as any,
        amount: -Math.abs(expense.amount), // Negative for expense
        description: expense.description,
        status: 'completed',
        transaction_date: expense.expense_date,
        reference_number: `EXP-${expense.id}`,
      })
    }

    return NextResponse.json({ success: true, expense })
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

// DELETE expense
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Expense ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
