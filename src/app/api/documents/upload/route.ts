// Document Upload API
// Upload files to Supabase Storage and create document records

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const file = formData.get('file') as File
    const documentType = formData.get('document_type') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const assetId = formData.get('asset_id') as string
    const ownerId = formData.get('owner_id') as string
    const bookingId = formData.get('booking_id') as string
    const expenseId = formData.get('expense_id') as string
    const uploadedBy = formData.get('uploaded_by') as string

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (!documentType || !title) {
      return NextResponse.json(
        { error: 'Document type and title are required' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${documentType}/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    // Create document record
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        document_type: documentType,
        title,
        description,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        asset_id: assetId || null,
        owner_id: ownerId || null,
        booking_id: bookingId || null,
        expense_id: expenseId || null,
        uploaded_by: uploadedBy || null,
        status: 'active',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Try to delete uploaded file
      await supabase.storage.from('documents').remove([filePath])
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 })
    }

    return NextResponse.json({ success: true, document }, { status: 201 })
  } catch (error) {
    console.error('Error in document upload:', error)
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
  }
}

// GET all documents
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const documentType = searchParams.get('type')
    const assetId = searchParams.get('asset_id')
    const ownerId = searchParams.get('owner_id')

    let query = supabase
      .from('documents')
      .select('*, assets(name), owners(business_name), bookings(booking_number)')
      .order('created_at', { ascending: false })

    if (documentType) {
      query = query.eq('document_type', documentType)
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

    return NextResponse.json({ documents: data })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

// DELETE document
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    }

    // Get document to find file path
    const { data: document } = await supabase
      .from('documents')
      .select('file_url')
      .eq('id', id)
      .single()

    if (document?.file_url) {
      // Extract path from URL
      const urlParts = document.file_url.split('documents/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        // Delete from storage
        await supabase.storage.from('documents').remove([filePath])
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
