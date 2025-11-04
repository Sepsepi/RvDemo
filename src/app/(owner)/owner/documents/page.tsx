import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Download, Eye, Calendar } from 'lucide-react'

export default async function OwnerDocumentsPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'owner') {
    redirect('/login')
  }

  const supabase = await createClient()

  // Get owner (take first if multiple)
  const { data: ownerData } = await supabase
    .from('owners')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)

  const owner = ownerData?.[0]

  if (!owner) {
    console.error('Owner not found for user:', user.id)

    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-900 font-semibold mb-2">Setting up your documents...</p>
              <p className="text-gray-600">
                Run: supabase/complete-owner-fix.sql
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch documents
  const { data: documents } = await supabase
    .from('documents')
    .select('*, assets(name)')
    .eq('owner_id', owner.id)
    .order('created_at', { ascending: false })

  const typeColors: Record<string, string> = {
    rental_receipt: 'bg-green-100 text-green-800',
    maintenance_receipt: 'bg-orange-100 text-orange-800',
    consignment_contract: 'bg-purple-100 text-purple-800',
    insurance_policy: 'bg-blue-100 text-blue-800',
    owner_statement: 'bg-indigo-100 text-indigo-800',
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Documents</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{documents?.length || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Total Documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">
              {documents?.filter(d => d.document_type?.includes('receipt')).length || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Receipts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">
              {documents?.filter(d => d.document_type === 'owner_statement').length || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Statements</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">
              {documents?.filter(d => d.document_type?.includes('contract')).length || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Contracts</p>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      {documents && documents.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {documents.map((doc: any) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <FileText className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{doc.title}</h3>
                      <p className="text-sm text-gray-500 mb-2">{doc.file_name}</p>

                      <div className="flex items-center gap-4 text-sm">
                        <Badge
                          className={typeColors[doc.document_type] || 'bg-gray-100 text-gray-800'}
                          variant="secondary"
                        >
                          {doc.document_type.replace('_', ' ')}
                        </Badge>

                        {doc.assets && (
                          <span className="text-gray-600">{doc.assets.name}</span>
                        )}

                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(doc.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-20 w-20 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium mb-2">No documents yet</h3>
            <p className="text-gray-500 text-center">
              Your contracts, receipts, and statements will appear here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
