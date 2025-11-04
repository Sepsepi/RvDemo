import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FileText,
  Upload,
  Search,
  Download,
  Eye,
  Filter,
  File,
  FileCheck,
  FileX,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; search?: string; owner?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Build query with filters
  let query = supabase
    .from('documents')
    .select('*, assets(name), owners(business_name), bookings(booking_number)')
    .order('created_at', { ascending: false })

  if (params.type && params.type !== 'all') {
    query = query.eq('document_type', params.type)
  }

  if (params.owner) {
    query = query.eq('owner_id', params.owner)
  }

  if (params.search) {
    query = query.ilike('title', `%${params.search}%`)
  }

  const { data: documents } = await query

  // Get unique owners for filter
  const { data: owners } = await supabase
    .from('owners')
    .select('id, business_name')
    .order('business_name')

  // Get document type counts
  const documentTypes = [
    'rental_receipt',
    'maintenance_receipt',
    'cleaning_invoice',
    'insurance_policy',
    'vehicle_registration',
    'consignment_contract',
    'rental_agreement',
    'inspection_report',
    'damage_report',
    'owner_statement',
    'payment_receipt',
    'other',
  ]

  const typeColors: Record<string, string> = {
    rental_receipt: 'bg-green-100 text-green-800',
    maintenance_receipt: 'bg-orange-100 text-orange-800',
    cleaning_invoice: 'bg-blue-100 text-blue-800',
    insurance_policy: 'bg-purple-100 text-purple-800',
    vehicle_registration: 'bg-indigo-100 text-indigo-800',
    consignment_contract: 'bg-red-100 text-red-800',
    rental_agreement: 'bg-green-100 text-green-800',
    inspection_report: 'bg-yellow-100 text-yellow-800',
    damage_report: 'bg-red-100 text-red-800',
    owner_statement: 'bg-indigo-100 text-indigo-800',
    payment_receipt: 'bg-green-100 text-green-800',
    other: 'bg-gray-100 text-gray-800',
  }

  const typeIcons: Record<string, any> = {
    rental_receipt: FileCheck,
    maintenance_receipt: FileText,
    cleaning_invoice: FileText,
    insurance_policy: File,
    vehicle_registration: File,
    consignment_contract: FileText,
    rental_agreement: FileCheck,
    inspection_report: FileText,
    damage_report: FileX,
    owner_statement: FileCheck,
    payment_receipt: FileCheck,
    other: File,
  }

  function formatFileSize(bytes?: number) {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  function formatDocumentType(type: string) {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-500 mt-1">
            Central repository for all receipts, contracts, and documents
          </p>
        </div>
        <Link href="/manager/documents/upload">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {documents?.length || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receipts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {documents?.filter(d =>
                    d.document_type?.includes('receipt') || d.document_type?.includes('invoice')
                  ).length || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FileCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contracts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {documents?.filter(d => d.document_type?.includes('contract')).length || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <File className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {documents?.filter(d => {
                    const createdDate = new Date(d.created_at)
                    const now = new Date()
                    return (
                      createdDate.getMonth() === now.getMonth() &&
                      createdDate.getFullYear() === now.getFullYear()
                    )
                  }).length || 0}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Calendar className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                className="pl-10"
                defaultValue={params.search}
                name="search"
              />
            </div>

            <Select defaultValue={params.type || 'all'}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {documentTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {formatDocumentType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select defaultValue={params.owner || 'all'}>
              <SelectTrigger>
                <SelectValue placeholder="All Owners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                {owners?.map(owner => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.business_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {documents && documents.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Related To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc: any) => {
                    const Icon = typeIcons[doc.document_type] || File
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-gray-100 rounded">
                              <Icon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                              <p className="text-xs text-gray-500">{doc.file_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            className={typeColors[doc.document_type] || 'bg-gray-100 text-gray-800'}
                            variant="secondary"
                          >
                            {formatDocumentType(doc.document_type)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {doc.assets?.name ||
                            doc.bookings?.booking_number ||
                            doc.description ||
                            '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {doc.owners?.business_name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {doc.document_date
                            ? new Date(doc.document_date).toLocaleDateString()
                            : new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatFileSize(doc.file_size)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500 text-center mb-6">
              {params.type || params.owner || params.search
                ? 'Try adjusting your filters'
                : 'Start by uploading your first document'}
            </p>
            <Link href="/manager/documents/upload">
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
