'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Camera,
  CheckCircle,
  AlertTriangle,
  Upload,
  Save,
  ArrowLeft,
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function InspectionPage() {
  const params = useParams()
  const booking_id = params.booking_id as string
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [booking, setBooking] = useState<any>(null)
  const [inspectionType, setInspectionType] = useState<'checkin' | 'checkout'>('checkin')

  const [formData, setFormData] = useState({
    mileage: '',
    fuel_level: 'Full',
    exterior_condition: 'good',
    interior_condition: 'good',
    mechanical_condition: 'good',
    damages_found: false,
    damage_description: '',
    estimated_repair_cost: '',
    notes: '',
    checklist: {
      tires: true,
      brakes: true,
      lights: true,
      windshield: true,
      awning: true,
      slideouts: true,
      appliances: true,
      bathroom: true,
      generator: true,
      water_system: true,
    },
  })

  useEffect(() => {
    fetchBooking()
  }, [])

  async function fetchBooking() {
    try {
      const response = await fetch(`/api/bookings/${booking_id}`)
      const data = await response.json()
      setBooking(data.booking)

      // Determine if checkin or checkout
      if (data.booking.actual_checkin_time && !data.booking.actual_checkout_time) {
        setInspectionType('checkout')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      // Create inspection record
      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking_id,
          asset_id: booking.asset_id,
          inspection_type: inspectionType,
          mileage: parseInt(formData.mileage),
          fuel_level: formData.fuel_level,
          exterior_condition: formData.exterior_condition,
          interior_condition: formData.interior_condition,
          mechanical_condition: formData.mechanical_condition,
          damages_found: formData.damages_found,
          damage_description: formData.damage_description,
          estimated_repair_cost: formData.estimated_repair_cost ? parseFloat(formData.estimated_repair_cost) : null,
          notes: formData.notes,
          checklist_items: formData.checklist,
        }),
      })

      if (response.ok) {
        // Update booking status
        const newStatus = inspectionType === 'checkin' ? 'checked_in' : 'checked_out'
        await fetch('/api/bookings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: booking_id,
            status: newStatus,
            [`actual_${inspectionType}_time`]: new Date().toISOString(),
            [`${inspectionType}_mileage`]: parseInt(formData.mileage),
          }),
        })

        alert('Inspection completed successfully!')
        router.push(`/manager/bookings/${booking_id}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to save inspection')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href={`/manager/bookings/${booking_id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Booking
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {inspectionType === 'checkin' ? 'Check-in' : 'Check-out'} Inspection
        </h1>
        <p className="text-gray-500 mt-1">
          {booking?.booking_number} - {booking?.assets?.name}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inspection Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mileage *</Label>
                    <Input
                      type="number"
                      value={formData.mileage}
                      onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Fuel Level *</Label>
                    <Select
                      value={formData.fuel_level}
                      onValueChange={(value) => setFormData({ ...formData, fuel_level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full">Full</SelectItem>
                        <SelectItem value="3/4">3/4</SelectItem>
                        <SelectItem value="1/2">1/2</SelectItem>
                        <SelectItem value="1/4">1/4</SelectItem>
                        <SelectItem value="Empty">Empty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Condition Assessment */}
            <Card>
              <CardHeader>
                <CardTitle>Condition Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Exterior Condition</Label>
                  <Select
                    value={formData.exterior_condition}
                    onValueChange={(value) => setFormData({ ...formData, exterior_condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Interior Condition</Label>
                  <Select
                    value={formData.interior_condition}
                    onValueChange={(value) => setFormData({ ...formData, interior_condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Mechanical Condition</Label>
                  <Select
                    value={formData.mechanical_condition}
                    onValueChange={(value) => setFormData({ ...formData, mechanical_condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Checklist */}
            <Card>
              <CardHeader>
                <CardTitle>Inspection Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(formData.checklist).map((item) => (
                    <div key={item} className="flex items-center space-x-2">
                      <Checkbox
                        id={item}
                        checked={formData.checklist[item as keyof typeof formData.checklist]}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            checklist: {
                              ...formData.checklist,
                              [item]: checked === true,
                            },
                          })
                        }
                      />
                      <label
                        htmlFor={item}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                      >
                        {item.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Damages */}
            <Card>
              <CardHeader>
                <CardTitle>Damage Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="damages"
                    checked={formData.damages_found}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, damages_found: checked === true })
                    }
                  />
                  <label htmlFor="damages" className="text-sm font-medium">
                    Damages Found
                  </label>
                </div>

                {formData.damages_found && (
                  <>
                    <div>
                      <Label>Damage Description *</Label>
                      <Textarea
                        value={formData.damage_description}
                        onChange={(e) =>
                          setFormData({ ...formData, damage_description: e.target.value })
                        }
                        placeholder="Describe the damage in detail..."
                        rows={3}
                        required={formData.damages_found}
                      />
                    </div>
                    <div>
                      <Label>Estimated Repair Cost</Label>
                      <Input
                        type="number"
                        value={formData.estimated_repair_cost}
                        onChange={(e) =>
                          setFormData({ ...formData, estimated_repair_cost: e.target.value })
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional observations..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Photo Upload & Summary */}
          <div className="space-y-6">
            {/* Photo Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 cursor-pointer">
                  <Camera className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600">Click to upload photos</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Exterior, interior, dashboard
                  </p>
                  <input type="file" accept="image/*" multiple className="hidden" />
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Inspection Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <Badge>
                    {inspectionType === 'checkin' ? 'Check-in' : 'Check-out'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Overall Condition</p>
                  <div className="flex gap-2 mt-1">
                    {formData.exterior_condition === 'good' &&
                    formData.interior_condition === 'good' &&
                    formData.mechanical_condition === 'good' ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Good Condition
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Needs Attention
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Checklist Items</p>
                  <p className="font-medium">
                    {Object.values(formData.checklist).filter(Boolean).length} / {Object.keys(formData.checklist).length} Passed
                  </p>
                </div>
                {formData.damages_found && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm font-semibold text-red-800">
                      ⚠️ Damages Reported
                    </p>
                    {formData.estimated_repair_cost && (
                      <p className="text-xs text-red-600 mt-1">
                        Est. Cost: ${formData.estimated_repair_cost}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Button type="submit" className="w-full" size="lg" disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Complete {inspectionType === 'checkin' ? 'Check-in' : 'Check-out'}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
