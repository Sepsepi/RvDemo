import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  DollarSign,
  Truck,
  Calendar,
  TrendingUp,
  FileText,
  Download,
  ArrowUpRight,
} from 'lucide-react'

export default async function OwnerPortal() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'owner') {
    redirect('/login')
  }

  const supabase = await createClient()

  // Get owner record (take first if multiple)
  const { data: ownerData, error: ownerError } = await supabase
    .from('owners')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)

  const owner = ownerData?.[0]

  if (!owner) {
    console.error('Owner not found for user:', user.id, ownerError)

    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-900 font-semibold mb-2">Setting up your owner account...</p>
              <p className="text-gray-600 mb-4">
                Your profile is being configured. If this persists, please contact support.
              </p>
              <p className="text-sm text-gray-500">
                User ID: {user.id}<br/>
                Email: {user.email}<br/>
                Role: {user.role}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch owner's data
  const [
    { data: assets },
    { data: bookings },
    { data: remittances },
    { data: expenses },
    { data: transactions },
  ] = await Promise.all([
    supabase.from('assets').select('*').eq('owner_id', owner.id),
    supabase
      .from('bookings')
      .select('*, assets(name)')
      .eq('owner_id', owner.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('remittances')
      .select('*')
      .eq('owner_id', owner.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('expenses')
      .select('*, assets(name)')
      .eq('owner_id', owner.id)
      .eq('status', 'approved')
      .order('expense_date', { ascending: false }),
    supabase
      .from('transactions')
      .select('*')
      .eq('owner_id', owner.id)
      .order('transaction_date', { ascending: false }),
  ])

  // Calculate metrics
  const totalRVs = assets?.length || 0
  const availableRVs = assets?.filter(a => a.status === 'available').length || 0

  const totalBookings = bookings?.length || 0
  const activeBookings = bookings?.filter(b => b.status === 'active' || b.status === 'confirmed').length || 0

  const grossRevenue = bookings
    ?.filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0

  const totalExpenses = expenses?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0

  const totalPaidOut = remittances
    ?.filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + (Number(r.owner_payout_amount) || 0), 0) || 0

  const pendingPayouts = remittances
    ?.filter(r => r.status === 'pending' || r.status === 'draft')
    .reduce((sum, r) => sum + (Number(r.owner_payout_amount) || 0), 0) || 0

  // Calculate monthly earnings (last 6 months)
  const monthlyEarnings: Record<string, number> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = date.toLocaleDateString('en-US', { month: 'short' })
    monthlyEarnings[key] = 0
  }

  transactions
    ?.filter(t => t.transaction_type === 'rental_income')
    .forEach(transaction => {
      const date = new Date(transaction.transaction_date)
      const key = date.toLocaleDateString('en-US', { month: 'short' })
      if (monthlyEarnings[key] !== undefined) {
        monthlyEarnings[key] += Number(transaction.amount) || 0
      }
    })

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    in_use: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-orange-100 text-orange-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.full_name}!</h1>
        <p className="text-gray-500 mt-1">
          {owner.business_name || 'Your'} Portfolio Overview
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Your RVs</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalRVs}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500">{availableRVs} available for rent</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ${totalPaidOut.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center text-xs">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-600">Paid out to you</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ${pendingPayouts.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500">Being processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Bookings</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalBookings}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500">{activeBookings} currently active</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Gross Revenue</p>
                  <p className="text-2xl font-bold text-green-600">${grossRevenue.toLocaleString()}</p>
                </div>
                <ArrowUpRight className="h-6 w-6 text-green-600" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Platform Fee (10%)</span>
                  <span className="font-medium text-gray-900">
                    -${(grossRevenue * 0.1).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Expenses</span>
                  <span className="font-medium text-gray-900">-${totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Your Split ({owner.revenue_split_percentage}%)</span>
                  <span className="font-medium text-gray-900">
                    {owner.revenue_split_percentage}%
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-between">
                <span className="font-semibold text-gray-900">Your Earnings</span>
                <span className="text-2xl font-bold text-purple-600">
                  ${totalPaidOut.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Earnings Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Earnings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(monthlyEarnings).map(([month, amount]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{month}</span>
                  <div className="flex-1 mx-4">
                    <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                        style={{
                          width: `${(amount / Math.max(...Object.values(monthlyEarnings), 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                    ${Math.round(amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Your RVs Performance */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your RV Fleet Performance</CardTitle>
            <Link href="/owner/assets">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {assets && assets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset: any) => {
                const assetBookings = bookings?.filter(b => b.asset_id === asset.id) || []
                const assetRevenue = assetBookings
                  .filter(b => b.status === 'completed')
                  .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0)
                const assetActiveBookings = assetBookings.filter(
                  b => b.status === 'active' || b.status === 'confirmed'
                ).length

                return (
                  <div
                    key={asset.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{asset.name}</p>
                        <p className="text-xs text-gray-500">
                          {asset.year} • {asset.rv_type}
                        </p>
                      </div>
                      <Badge className={statusColors[asset.status]} variant="secondary">
                        {asset.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Revenue:</span>
                        <span className="font-semibold text-green-600">
                          ${assetRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Bookings:</span>
                        <span className="font-medium text-gray-900">{assetBookings.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Active:</span>
                        <span className="font-medium text-blue-600">{assetActiveBookings}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Rate:</span>
                        <span className="font-medium text-gray-900">
                          ${asset.base_price_per_night}/night
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No RVs in your portfolio yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings && bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((booking: any) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{booking.assets?.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        ${Number(booking.total_amount).toLocaleString()}
                      </p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No bookings yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses && expenses.length > 0 ? (
              <div className="space-y-3">
                {expenses.slice(0, 5).map((expense: any) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{expense.description}</p>
                      <p className="text-xs text-gray-500">
                        {expense.assets?.name} • {formatDate(expense.expense_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-orange-600">
                        -${Number(expense.amount).toLocaleString()}
                      </p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {expense.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No expenses</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      {remittances && remittances.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Payment History</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {remittances.map((remittance: any) => (
                <div
                  key={remittance.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{remittance.remittance_number}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(remittance.period_start)} - {formatDate(remittance.period_end)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600">
                      ${Number(remittance.owner_payout_amount).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        className={
                          remittance.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                        variant="secondary"
                      >
                        {remittance.status}
                      </Badge>
                      {remittance.statement_pdf_url && (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Your Contract Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Revenue Split</p>
              <p className="text-2xl font-bold text-purple-600">{owner.revenue_split_percentage}%</p>
              <p className="text-xs text-gray-500">You receive</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Platform Fee</p>
              <p className="text-2xl font-bold text-gray-900">{owner.platform_fee_percentage}%</p>
              <p className="text-xs text-gray-500">Deducted from gross</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Contract Type</p>
              <p className="text-lg font-bold text-gray-900 capitalize">
                {owner.contract_type || 'Standard'}
              </p>
              <p className="text-xs text-gray-500">Current plan</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Payout Method</p>
              <p className="text-lg font-bold text-gray-900 uppercase">
                {owner.preferred_payout_method || 'ACH'}
              </p>
              <p className="text-xs text-gray-500">Bank transfer</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
