import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Truck, Plus, Search, Filter } from 'lucide-react'
import Link from 'next/link'

export default async function FleetPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Build query with filters
  let query = supabase
    .from('assets')
    .select('*, owners(business_name)')
    .order('created_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status)
  }

  if (params.type) {
    query = query.eq('rv_type', params.type)
  }

  if (params.search) {
    query = query.ilike('name', `%${params.search}%`)
  }

  const { data: assets } = await query

  // Get unique RV types for filter
  const { data: allAssets } = await supabase.from('assets').select('rv_type')
  const rvTypes = [...new Set(allAssets?.map(a => a.rv_type).filter(Boolean))]

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    in_use: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-orange-100 text-orange-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-500 mt-1">Manage your RV inventory</p>
        </div>
        <Link href="/manager/fleet/add">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add RV
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name..."
                className="pl-10"
                defaultValue={params.search}
                name="search"
              />
            </div>

            <Select defaultValue={params.status || 'all'}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="in_use">In Use</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue={params.type || 'all'}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {rvTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Grid */}
      {assets && assets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset: any) => (
            <Link key={asset.id} href={`/manager/fleet/${asset.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{asset.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {asset.year} • {asset.make} • {asset.rv_type}
                      </p>
                    </div>
                    <Badge className={statusColors[asset.status] || ''} variant="secondary">
                      {asset.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Owner:</span>
                      <span className="font-medium">{asset.owners?.business_name || 'N/A'}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">
                        {asset.city}, {asset.state}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Sleeps:</span>
                      <span className="font-medium">{asset.sleeps} people</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Length:</span>
                      <span className="font-medium">{asset.length_feet} ft</span>
                    </div>

                    <div className="pt-3 border-t flex items-center justify-between">
                      <span className="text-lg font-bold text-indigo-600">
                        ${asset.base_price_per_night}
                        <span className="text-sm font-normal text-gray-500">/night</span>
                      </span>
                      <Button variant="ghost" size="sm">
                        View Details →
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No RVs found</h3>
            <p className="text-gray-500 text-center mb-6">
              {params.status || params.type || params.search
                ? 'Try adjusting your filters'
                : 'Get started by adding your first RV to the fleet'}
            </p>
            <Link href="/manager/fleet/add">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add RV
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {assets && assets.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{assets.length}</p>
                <p className="text-sm text-gray-500">Total Assets</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {assets.filter(a => a.status === 'available').length}
                </p>
                <p className="text-sm text-gray-500">Available</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {assets.filter(a => a.status === 'in_use').length}
                </p>
                <p className="text-sm text-gray-500">In Use</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {assets.filter(a => a.status === 'maintenance').length}
                </p>
                <p className="text-sm text-gray-500">Maintenance</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-600">
                  $
                  {Math.round(
                    assets.reduce((sum, a) => sum + Number(a.base_price_per_night || 0), 0) /
                      assets.length
                  )}
                </p>
                <p className="text-sm text-gray-500">Avg Price/Night</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
