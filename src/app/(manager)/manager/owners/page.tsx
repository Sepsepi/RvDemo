import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Search, Plus, Eye, DollarSign, Truck, TrendingUp, FileText } from 'lucide-react'
import Link from 'next/link'

export default async function OwnersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch owners with related data
  let query = supabase
    .from('owners')
    .select('*, assets(count), profiles(full_name, email)')
    .order('created_at', { ascending: false })

  if (params.search) {
    query = query.ilike('business_name', `%${params.search}%`)
  }

  const { data: owners } = await query

  // Get financial data for each owner
  const ownersWithStats = await Promise.all(
    (owners || []).map(async (owner: any) => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_amount, status')
        .eq('owner_id', owner.id)

      const totalRevenue = bookings
        ?.filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0

      const { data: assets } = await supabase
        .from('assets')
        .select('id')
        .eq('owner_id', owner.id)

      const { data: remittances } = await supabase
        .from('remittances')
        .select('owner_payout_amount, status')
        .eq('owner_id', owner.id)

      const totalPaidOut = remittances
        ?.filter(r => r.status === 'paid')
        .reduce((sum, r) => sum + (Number(r.owner_payout_amount) || 0), 0) || 0

      return {
        ...owner,
        assetCount: assets?.length || 0,
        totalRevenue,
        totalPaidOut,
        bookingsCount: bookings?.length || 0,
      }
    })
  )

  // Calculate totals
  const totalOwners = ownersWithStats?.length || 0
  const totalAssets = ownersWithStats?.reduce((sum, o) => sum + o.assetCount, 0) || 0
  const totalRevenue = ownersWithStats?.reduce((sum, o) => sum + o.totalRevenue, 0) || 0
  const totalPaidOut = ownersWithStats?.reduce((sum, o) => sum + o.totalPaidOut, 0) || 0

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Owners</h1>
          <p className="text-gray-500 mt-1">Manage RV owners and their portfolio</p>
        </div>
        <Link href="/manager/owners/add">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Owner
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Owners</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalOwners}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalAssets}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Out</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${totalPaidOut.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search owners by business name..."
              className="pl-10"
              defaultValue={params.search}
              name="search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Owners Grid */}
      {ownersWithStats && ownersWithStats.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ownersWithStats.map((owner: any) => (
            <Card key={owner.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-lg">
                      {owner.business_name?.charAt(0) || 'O'}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{owner.business_name || 'Unnamed Owner'}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {owner.profiles?.full_name || owner.profiles?.email || 'No contact'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={
                      owner.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                    variant="secondary"
                  >
                    {owner.status || 'active'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">RVs Owned</p>
                    <p className="text-xl font-bold text-gray-900">{owner.assetCount}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Bookings</p>
                    <p className="text-xl font-bold text-gray-900">{owner.bookingsCount}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Revenue Split:</span>
                    <span className="font-semibold text-gray-900">
                      {owner.revenue_split_percentage}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Contract Type:</span>
                    <Badge variant="outline" className="text-xs">
                      {owner.contract_type || 'standard'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Revenue:</span>
                    <span className="font-semibold text-green-600">
                      ${owner.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Paid Out:</span>
                    <span className="font-semibold text-indigo-600">
                      ${owner.totalPaidOut.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/manager/owners/${owner.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/manager/owners/${owner.id}/statements`}>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No owners found</h3>
            <p className="text-gray-500 text-center mb-6">
              {params.search
                ? 'Try adjusting your search'
                : 'Get started by adding your first asset owner'}
            </p>
            <Link href="/manager/owners/add">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Owner
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
