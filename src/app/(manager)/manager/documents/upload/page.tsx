'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileText, CheckCircle, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DocumentUploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    document_type: 'other',
    title: '',
    description: '',
    asset_id: '',
    owner_id: '',
    booking_id: '',
    expense_id: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setUploading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('file', file)
      formDataToSend.append('document_type', formData.document_type)
      formDataToSend.append('title', formData.title)
      if (formData.description) formDataToSend.append('description', formData.description)
      if (formData.asset_id) formDataToSend.append('asset_id', formData.asset_id)
      if (formData.owner_id) formDataToSend.append('owner_id', formData.owner_id)
      if (formData.booking_id) formDataToSend.append('booking_id', formData.booking_id)
      if (formData.expense_id) formDataToSend.append('expense_id', formData.expense_id)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formDataToSend,
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/manager/documents'), 2000)
      } else {
        const error = await response.json()
        alert(error.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (success) {
    return (
      <div className="p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Document Uploaded!</h2>
            <p className="text-gray-600">Redirecting to documents page...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/manager/documents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
        </Link>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <Label htmlFor="file">File *</Label>
              <div className="mt-2">
                <label
                  htmlFor="file"
                  className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-400 cursor-pointer"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {file ? file.name : 'Click to upload file'}
                    </span>
                    <span className="text-xs text-gray-500">PDF, Images, Documents</span>
                  </div>
                  <input
                    id="file"
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </label>
              </div>
            </div>

            {/* Document Type */}
            <div>
              <Label htmlFor="document_type">Document Type *</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) => setFormData({ ...formData, document_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rental_receipt">Rental Receipt</SelectItem>
                  <SelectItem value="maintenance_receipt">Maintenance Receipt</SelectItem>
                  <SelectItem value="cleaning_invoice">Cleaning Invoice</SelectItem>
                  <SelectItem value="insurance_policy">Insurance Policy</SelectItem>
                  <SelectItem value="vehicle_registration">Vehicle Registration</SelectItem>
                  <SelectItem value="consignment_contract">Consignment Contract</SelectItem>
                  <SelectItem value="rental_agreement">Rental Agreement</SelectItem>
                  <SelectItem value="inspection_report">Inspection Report</SelectItem>
                  <SelectItem value="damage_report">Damage Report</SelectItem>
                  <SelectItem value="owner_statement">Owner Statement</SelectItem>
                  <SelectItem value="payment_receipt">Payment Receipt</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Document Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Oil Change Receipt - May 2024"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional notes about this document..."
                rows={3}
              />
            </div>

            {/* Related Records (Optional) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="asset_id">Related RV (Optional)</Label>
                <Input
                  id="asset_id"
                  value={formData.asset_id}
                  onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                  placeholder="Asset UUID"
                />
              </div>
              <div>
                <Label htmlFor="owner_id">Related Owner (Optional)</Label>
                <Input
                  id="owner_id"
                  value={formData.owner_id}
                  onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                  placeholder="Owner UUID"
                />
              </div>
            </div>

            <Button type="submit" disabled={!file || uploading} className="w-full" size="lg">
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
