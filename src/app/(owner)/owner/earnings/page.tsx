import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, Download, FileText, Calendar } from 'lucide-react'

export default async function OwnerEarningsPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'owner') {
    redirect('/login')
  }

  const supabase = await createClient()

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
              <p className="text-gray-900 font-semibold mb-2">Setting up your earnings...</p>
              <p className="text-gray-600">
                Run the SQL fix: supabase/complete-owner-fix.sql in Supabase
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch financial data
  const [
    { data: bookings },
    { data: expenses },
    { data: remittances },
    { data: transactions },
  ] = await Promise.all([
    supabase.from('bookings').select('*').eq('owner_id', owner.id),
    supabase.from('expenses').select('*').eq('owner_id', owner.id).eq('status', 'approved'),
    supabase.from('remittances').select('*').eq('owner_id', owner.id).order('created_at', { ascending: false }),
    supabase.from('transactions').select('*').eq('owner_id', owner.id).order('transaction_date', { ascending: false }),
  ])

  const grossRevenue = bookings
    ?.filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0

  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0
  const platformFee = grossRevenue * 0.1
  const netIncome = grossRevenue - platformFee - totalExpenses
  const yourEarnings = netIncome * (owner.revenue_split_percentage / 100)

  const totalPaid = remittances
    ?.filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + Number(r.owner_payout_amount || 0), 0) || 0

  const pending = remittances
    ?.filter(r => r.status === 'pending' || r.status === 'draft')
    .reduce((sum, r) => sum + Number(r.owner_payout_amount || 0), 0) || 0

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Earnings</h1>
          <p className="text-gray-500 mt-1">Track your revenue and payouts</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Gross Revenue</p>
            <p className="text-3xl font-bold text-green-600">${grossRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Total Paid Out</p>
            <p className="text-3xl font-bold">${totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">${pending.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Your Split</p>
            <p className="text-3xl font-bold text-purple-600">{owner.revenue_split_percentage}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Earnings Breakdown (All Time)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between p-4 bg-green-50 rounded-lg">
              <span className="font-medium">Gross Revenue</span>
              <span className="font-bold text-green-600">${grossRevenue.toLocaleString()}</span>
            </div>

            <div className="space-y-2 px-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Platform Fee (10%)</span>
                <span className="text-red-600">-${platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Expenses</span>
                <span className="text-red-600">-${totalExpenses.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between p-4 bg-gray-50 rounded-lg border-t-2">
              <span className="font-medium">Net Income</span>
              <span className="font-bold">${netIncome.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-sm px-4">
              <span className="text-gray-600">Your Share ({owner.revenue_split_percentage}%)</span>
              <span>× {owner.revenue_split_percentage}%</span>
            </div>

            <div className="flex justify-between p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <span className="font-bold text-lg">YOUR EARNINGS</span>
              <span className="font-bold text-2xl text-purple-600">${yourEarnings.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {remittances && remittances.length > 0 ? (
            <div className="space-y-3">
              {remittances.map((rem: any) => (
                <div
                  key={rem.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">{rem.remittance_number}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(rem.period_start)} - {formatDate(rem.period_end)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${Number(rem.owner_payout_amount).toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        className={
                          rem.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {rem.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-16 w-16 mx-auto mb-3 text-gray-300" />
              <p>No payment history yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
