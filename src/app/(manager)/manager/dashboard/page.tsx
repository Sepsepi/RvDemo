import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Truck, Calendar, DollarSign, Wrench, TrendingUp, AlertCircle } from 'lucide-react'

export default async function ManagerDashboard() {
  const supabase = await createClient()

  // Fetch dashboard data
  const [
    { data: assets },
    { data: bookings },
    { data: recentBookings },
    { data: maintenanceRequests },
    { data: owners },
  ] = await Promise.all([
    supabase.from('assets').select('*'),
    supabase.from('bookings').select('*'),
    supabase
      .from('bookings')
      .select('*, assets(name), renters(*)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('maintenance_requests')
      .select('*, assets(name)')
      .in('status', ['requested', 'scheduled', 'in_progress'])
      .limit(5),
    supabase.from('owners').select('*'),
  ])

  // Calculate stats
  const totalAssets = assets?.length || 0
  const availableAssets = assets?.filter(a => a.status === 'available').length || 0
  const inUseAssets = assets?.filter(a => a.status === 'in_use').length || 0
  const maintenanceAssets = assets?.filter(a => a.status === 'maintenance').length || 0

  const totalBookings = bookings?.length || 0
  const activeBookings = bookings?.filter(b => b.status === 'active' || b.status === 'confirmed').length || 0
  const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0

  const totalRevenue = bookings
    ?.filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0

  const pendingMaintenance = maintenanceRequests?.length || 0
  const totalOwners = owners?.length || 0

  const stats = [
    {
      title: 'Total Fleet',
      value: totalAssets,
      subtitle: `${availableAssets} available`,
      icon: Truck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Bookings',
      value: activeBookings,
      subtitle: `${completedBookings} completed`,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      subtitle: `${totalBookings} bookings`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Maintenance',
      value: pendingMaintenance,
      subtitle: 'pending items',
      icon: Wrench,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    in_use: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-orange-100 text-orange-800',
    inactive: 'bg-gray-100 text-gray-800',
    confirmed: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    requested: 'bg-yellow-100 text-yellow-800',
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-orange-100 text-orange-800',
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's your fleet overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings && recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{booking.assets?.name || 'Unknown Asset'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {booking.booking_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={statusColors[booking.status] || ''} variant="secondary">
                        {booking.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        ${Number(booking.total_amount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No bookings yet</p>
                <p className="text-sm text-gray-400 mt-1">Bookings will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            {maintenanceRequests && maintenanceRequests.length > 0 ? (
              <div className="space-y-4">
                {maintenanceRequests.map((request: any) => (
                  <div
                    key={request.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{request.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {request.assets?.name || 'Unknown Asset'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={statusColors[request.status] || ''} variant="secondary">
                        {request.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">{request.priority}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Wrench className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No pending maintenance</p>
                <p className="text-sm text-gray-400 mt-1">All assets are in good condition</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fleet Status Overview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Fleet Status</CardTitle>
        </CardHeader>
        <CardContent>
          {assets && assets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.slice(0, 6).map((asset: any) => (
                <div
                  key={asset.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-xs text-gray-500">
                        {asset.year} {asset.make} {asset.model}
                      </p>
                    </div>
                    <Badge className={statusColors[asset.status] || ''} variant="secondary">
                      {asset.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-600">${asset.base_price_per_night}/night</span>
                    <span className="text-gray-400">{asset.rv_type}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Truck className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No assets in fleet</p>
              <p className="text-sm text-gray-400 mt-1">Start by adding RVs to your fleet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
