'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Truck, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function OnboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    // Owner Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    businessName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',

    // RV Info
    rvYear: '',
    rvMake: '',
    rvModel: '',
    rvType: '',
    vin: '',
    licensePlate: '',
    length: '',
    sleeps: '',
    basePrice: '',

    // Additional Info
    insuranceProvider: '',
    policyNumber: '',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/onboard/owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        alert(result.error || 'Failed to submit. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-12 pb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
            <p className="text-gray-600 mb-2">
              Thank you for your interest in joining Consignments.ai!
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Our team will review your application and RV details. We'll contact you within 24-48 hours.
            </p>
            <p className="text-sm text-indigo-600 font-medium">
              Your information has been sent to our system and HubSpot CRM.
            </p>
            <Button onClick={() => router.push('/login')} className="mt-6">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">Join Consignments.ai</h1>
          <p className="text-gray-600">List your RV and start earning passive income</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center mb-8 gap-2">
          <div className={`h-2 w-32 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
          <div className={`h-2 w-32 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
          <div className={`h-2 w-32 rounded-full ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Your Information */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
                <CardDescription>Tell us about yourself and your business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="businessName">Business Name (Optional)</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      required
                      maxLength={2}
                      placeholder="CA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <Button type="button" onClick={() => setStep(2)} className="w-full mt-6">
                  Next: RV Information
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: RV Information */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Truck className="h-6 w-6 text-indigo-600" />
                  <CardTitle>RV Information</CardTitle>
                </div>
                <CardDescription>Tell us about your RV</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rvYear">Year *</Label>
                    <Input
                      id="rvYear"
                      type="number"
                      value={formData.rvYear}
                      onChange={(e) => setFormData({ ...formData, rvYear: e.target.value })}
                      required
                      placeholder="2023"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rvMake">Make *</Label>
                    <Input
                      id="rvMake"
                      value={formData.rvMake}
                      onChange={(e) => setFormData({ ...formData, rvMake: e.target.value })}
                      required
                      placeholder="Forest River"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="rvModel">Model *</Label>
                  <Input
                    id="rvModel"
                    value={formData.rvModel}
                    onChange={(e) => setFormData({ ...formData, rvModel: e.target.value })}
                    required
                    placeholder="Rockwood"
                  />
                </div>

                <div>
                  <Label htmlFor="rvType">RV Type *</Label>
                  <Select
                    value={formData.rvType}
                    onValueChange={(value) => setFormData({ ...formData, rvType: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select RV type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Class A">Class A Motorhome</SelectItem>
                      <SelectItem value="Class B">Class B Van</SelectItem>
                      <SelectItem value="Class C">Class C Motorhome</SelectItem>
                      <SelectItem value="Travel Trailer">Travel Trailer</SelectItem>
                      <SelectItem value="Fifth Wheel">Fifth Wheel</SelectItem>
                      <SelectItem value="Toy Hauler">Toy Hauler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vin">VIN *</Label>
                    <Input
                      id="vin"
                      value={formData.vin}
                      onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="licensePlate">License Plate</Label>
                    <Input
                      id="licensePlate"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="length">Length (ft) *</Label>
                    <Input
                      id="length"
                      type="number"
                      value={formData.length}
                      onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                      required
                      placeholder="32"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sleeps">Sleeps *</Label>
                    <Input
                      id="sleeps"
                      type="number"
                      value={formData.sleeps}
                      onChange={(e) => setFormData({ ...formData, sleeps: e.target.value })}
                      required
                      placeholder="6"
                    />
                  </div>
                  <div>
                    <Label htmlFor="basePrice">Desired $/Night *</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      required
                      placeholder="150"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-full">
                    Back
                  </Button>
                  <Button type="button" onClick={() => setStep(3)} className="w-full">
                    Next: Additional Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Additional Information */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Insurance and other details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                    <Input
                      id="insuranceProvider"
                      value={formData.insuranceProvider}
                      onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                      placeholder="State Farm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="policyNumber">Policy Number</Label>
                    <Input
                      id="policyNumber"
                      value={formData.policyNumber}
                      onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional information you'd like us to know..."
                    rows={4}
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mt-6">
                  <h4 className="font-semibold text-gray-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Our team reviews your application (24-48 hours)</li>
                    <li>• We contact you to discuss contract terms</li>
                    <li>• Schedule RV inspection and photo shoot</li>
                    <li>• List your RV and start earning!</li>
                  </ul>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="w-full">
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  By submitting, you agree to our Terms of Service and Privacy Policy.
                  Your information will be stored securely in our database and HubSpot CRM.
                </p>
              </CardContent>
            </Card>
          )}
        </form>

        <div className="text-center mt-6">
          <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-500">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
