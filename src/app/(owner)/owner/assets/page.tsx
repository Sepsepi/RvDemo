import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Truck, MapPin, DollarSign, Calendar, TrendingUp, Eye, Edit } from 'lucide-react'
import Link from 'next/link'

export default async function OwnerAssetsPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'owner') {
    redirect('/login')
  }

  const supabase = await createClient()

  // Get owner record (take first if multiple)
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
              <p className="text-gray-900 font-semibold mb-2">Setting up your account...</p>
              <p className="text-gray-600">
                Run the SQL fix: supabase/complete-owner-fix.sql
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch owner's RVs
  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('owner_id', owner.id)
    .order('created_at', { ascending: false })

  // Get bookings and revenue for each asset
  const assetsWithStats = await Promise.all(
    (assets || []).map(async (asset: any) => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('asset_id', asset.id)

      const revenue = bookings
        ?.filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0

      const activeBookings = bookings?.filter(
        b => b.status === 'active' || b.status === 'confirmed'
      ).length || 0

      return {
        ...asset,
        totalBookings: bookings?.length || 0,
        revenue,
        activeBookings,
      }
    })
  )

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    in_use: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-orange-100 text-orange-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My RVs</h1>
          <p className="text-gray-500 mt-1">Manage your fleet</p>
        </div>
        <Button variant="outline">Add New RV</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{assets?.length || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Total RVs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">
              {assets?.filter(a => a.status === 'available').length || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">
              {assetsWithStats.reduce((sum, a) => sum + a.activeBookings, 0)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Active Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">
              ${assetsWithStats.reduce((sum, a) => sum + a.revenue, 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* RV Grid */}
      {assetsWithStats && assetsWithStats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assetsWithStats.map((asset: any) => (
            <Card key={asset.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{asset.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {asset.year} • {asset.rv_type}
                    </p>
                  </div>
                  <Badge className={statusColors[asset.status]} variant="secondary">
                    {asset.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">
                      {asset.city}, {asset.state}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Revenue Generated:</span>
                    <span className="font-semibold text-green-600">
                      ${asset.revenue.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Bookings:</span>
                    <span className="font-medium">{asset.totalBookings}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Active Bookings:</span>
                    <span className="font-medium text-blue-600">{asset.activeBookings}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Nightly Rate:</span>
                    <span className="font-medium">${asset.base_price_per_night}/night</span>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/owner/assets/${asset.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Truck className="h-20 w-20 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium mb-2">No RVs yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Contact the fleet manager to add your RVs
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
