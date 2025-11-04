import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Download,
} from 'lucide-react'

export default async function FinancialsPage() {
  const supabase = await createClient()

  // Fetch financial data
  const [
    { data: bookings },
    { data: expenses },
    { data: transactions },
    { data: remittances },
    { data: owners },
  ] = await Promise.all([
    supabase.from('bookings').select('*'),
    supabase.from('expenses').select('*'),
    supabase.from('transactions').select('*'),
    supabase.from('remittances').select('*, owners(business_name)'),
    supabase.from('owners').select('*'),
  ])

  // Calculate metrics
  const totalRevenue = bookings
    ?.filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0

  const platformFees = bookings
    ?.filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (Number(b.platform_fee) || 0), 0) || 0

  const totalExpenses = expenses
    ?.filter(e => e.status === 'approved')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0

  const totalRemittances = remittances
    ?.filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + (Number(r.owner_payout_amount) || 0), 0) || 0

  const pendingPayouts = remittances
    ?.filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + (Number(r.owner_payout_amount) || 0), 0) || 0

  const netProfit = totalRevenue - totalExpenses - totalRemittances

  // Calculate monthly revenue (last 6 months)
  const monthlyData: Record<string, number> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    monthlyData[key] = 0
  }

  bookings
    ?.filter(b => b.status === 'completed')
    .forEach(booking => {
      const date = new Date(booking.end_date)
      const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (monthlyData[key] !== undefined) {
        monthlyData[key] += Number(booking.total_amount) || 0
      }
    })

  // Get recent transactions
  const recentTransactions = transactions?.slice(0, 10) || []

  // Get pending remittances
  const pendingRemittances = remittances?.filter(r => r.status === 'pending' || r.status === 'draft') || []

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const transactionTypeColors: Record<string, string> = {
    rental_income: 'bg-green-100 text-green-800',
    maintenance: 'bg-orange-100 text-orange-800',
    cleaning: 'bg-blue-100 text-blue-800',
    insurance: 'bg-purple-100 text-purple-800',
    platform_fee: 'bg-indigo-100 text-indigo-800',
    damage: 'bg-red-100 text-red-800',
    refund: 'bg-yellow-100 text-yellow-800',
    remittance: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-500 mt-1">Track revenue, expenses, and owner payouts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generate Statement
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+12.5%</span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Platform Fees</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ${platformFees.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span>10% of gross revenue</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ${totalExpenses.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <ArrowDownRight className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <TrendingDown className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-orange-600 font-medium">-5.2%</span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ${netProfit.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span>After expenses & payouts</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart & Owner Payouts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(monthlyData).map(([month, amount]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{month}</span>
                  <div className="flex-1 mx-4">
                    <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                        style={{
                          width: `${(amount / Math.max(...Object.values(monthlyData))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    ${amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Owner Payouts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Owner Payouts</CardTitle>
              <Badge variant="secondary">{totalRemittances > 0 ? 'Paid' : 'Pending'}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Total Paid Out</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalRemittances.toLocaleString()}
                </p>
              </div>

              {pendingPayouts > 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-gray-600 mb-1">Pending Payouts</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    ${pendingPayouts.toLocaleString()}
                  </p>
                  <Button className="w-full mt-3" variant="outline" size="sm">
                    Process Payments
                  </Button>
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Average Payout per Owner</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${Math.round(totalRemittances / (owners?.length || 1)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Pending Remittances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.slice(0, 8).map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.description || transaction.transaction_type}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(transaction.transaction_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={
                          transactionTypeColors[transaction.transaction_type] ||
                          'bg-gray-100 text-gray-800'
                        }
                        variant="secondary"
                      >
                        {transaction.transaction_type.replace('_', ' ')}
                      </Badge>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        ${Number(transaction.amount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No transactions yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Remittances */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Remittances</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRemittances.length > 0 ? (
              <div className="space-y-3">
                {pendingRemittances.map((remittance: any) => (
                  <div
                    key={remittance.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {remittance.owners?.business_name || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(remittance.period_start)} - {formatDate(remittance.period_end)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        ${Number(remittance.owner_payout_amount || 0).toLocaleString()}
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No pending remittances</p>
                <Button className="mt-4" variant="outline" size="sm">
                  Generate Statements
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
