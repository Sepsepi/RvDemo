// Messages API - Real-time chat between renters and owners

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')
    const assetId = searchParams.get('asset_id')

    let query = supabase
      .from('communications')
      .select(`
        *,
        from_user:from_user_id(full_name, email, avatar_url),
        to_user:to_user_id(full_name, email, avatar_url),
        assets(name)
      `)
      .order('created_at', { ascending: true })

    // Get conversations where user is sender or receiver
    if (userId) {
      query = query.or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    }

    // Filter by asset
    if (assetId) {
      query = query.eq('asset_id', assetId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages: data })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST send new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data: message, error } = await supabase
      .from('communications')
      .insert({
        from_user_id: body.from_user_id,
        to_user_id: body.to_user_id,
        asset_id: body.asset_id,
        booking_id: body.booking_id,
        subject: body.subject,
        message: body.message,
        message_type: body.message_type || 'general',
      })
      .select(`
        *,
        from_user:from_user_id(full_name, email, avatar_url),
        to_user:to_user_id(full_name, email, avatar_url)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message }, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

// PATCH mark message as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    const { error } = await supabase
      .from('communications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
  }
}

// GET conversations list (grouped by users)
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    // Get all unique conversations for this user
    const { data: messages } = await supabase
      .from('communications')
      .select(`
        *,
        from_user:from_user_id(id, full_name, email, avatar_url),
        to_user:to_user_id(id, full_name, email, avatar_url),
        assets(id, name)
      `)
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    // Group by conversation partner
    const conversations = new Map()

    messages?.forEach((msg: any) => {
      const partnerId = msg.from_user_id === userId ? msg.to_user_id : msg.from_user_id
      const partner = msg.from_user_id === userId ? msg.to_user : msg.from_user

      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, {
          partner_id: partnerId,
          partner,
          asset: msg.assets,
          last_message: msg.message,
          last_message_at: msg.created_at,
          unread_count: 0,
        })
      }

      // Count unread messages
      if (msg.to_user_id === userId && !msg.is_read) {
        const conv = conversations.get(partnerId)
        conv.unread_count++
      }
    })

    return NextResponse.json({ conversations: Array.from(conversations.values()) })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}
