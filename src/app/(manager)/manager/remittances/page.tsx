'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign, FileText, Download, Calculator, Send } from 'lucide-react'

export default function RemittancesPage() {
  const [owners, setOwners] = useState<any[]>([])
  const [selectedOwner, setSelectedOwner] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [calculating, setCalculating] = useState(false)
  const [calculation, setCalculation] = useState<any>(null)

  useEffect(() => {
    fetchOwners()
  }, [])

  async function fetchOwners() {
    try {
      const response = await fetch('/api/owners')
      const data = await response.json()
      setOwners(data.owners || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function calculateRemittance() {
    if (!selectedOwner || !periodStart || !periodEnd) {
      alert('Please select owner and date range')
      return
    }

    setCalculating(true)

    try {
      const response = await fetch('/api/remittances/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_id: selectedOwner,
          period_start: periodStart,
          period_end: periodEnd,
        }),
      })

      const data = await response.json()
      setCalculation(data)
    } catch (error) {
      console.error('Error:', error)
      alert('Calculation failed')
    } finally {
      setCalculating(false)
    }
  }

  async function generatePDF() {
    if (!calculation) return

    try {
      const response = await fetch('/api/remittances/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calculation),
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `statement-${calculation.owner.business_name}-${periodStart}.pdf`
      a.click()
    } catch (error) {
      console.error('Error:', error)
      alert('PDF generation failed')
    }
  }

  async function sendToOwner() {
    if (!calculation) return

    try {
      const response = await fetch('/api/remittances/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...calculation,
          period_start: periodStart,
          period_end: periodEnd,
        }),
      })

      if (response.ok) {
        alert('Statement sent to owner and saved!')
        setCalculation(null)
        setSelectedOwner('')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to send')
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Remittance Calculator</h1>
        <p className="text-gray-500 mt-1">Generate owner payout statements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <Card>
          <CardHeader>
            <CardTitle>Calculate Owner Payout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Owner *</Label>
              <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose owner..." />
                </SelectTrigger>
                <SelectContent>
                  {owners.map(owner => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.business_name} ({owner.revenue_split_percentage}% split)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Period Start *</Label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div>
                <Label>Period End *</Label>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={calculateRemittance}
              disabled={calculating || !selectedOwner || !periodStart || !periodEnd}
              className="w-full"
              size="lg"
            >
              {calculating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Payout
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {calculation && (
          <Card>
            <CardHeader>
              <CardTitle>Payout Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Gross Rental Income</p>
                <p className="text-3xl font-bold text-green-600">
                  ${Number(calculation.gross_income).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  From {calculation.bookings_count} bookings
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Platform Fee (10%)</span>
                  <span className="font-medium text-red-600">
                    -${Number(calculation.platform_fees).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cleaning Fees</span>
                  <span className="font-medium text-red-600">
                    -${Number(calculation.cleaning_fees).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Maintenance & Expenses</span>
                  <span className="font-medium text-red-600">
                    -${Number(calculation.expenses).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Net Income</span>
                  <span className="font-semibold">
                    ${Number(calculation.net_income).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Owner Split ({calculation.owner.revenue_split_percentage}%)</span>
                  <span className="font-medium">× {calculation.owner.revenue_split_percentage}%</span>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                <p className="text-sm text-gray-600 mb-1">OWNER PAYOUT</p>
                <p className="text-4xl font-bold text-indigo-600">
                  ${Number(calculation.owner_payout).toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-4">
                <Button onClick={generatePDF} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button onClick={sendToOwner}>
                  <Send className="h-4 w-4 mr-2" />
                  Send to Owner
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
