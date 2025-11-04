import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Users,
  Ruler,
  DollarSign,
  Calendar,
  Wrench,
  FileText,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'

export default async function FleetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch asset with related data
  const { data: asset } = await supabase
    .from('assets')
    .select('*, owners(business_name, revenue_split_percentage, profiles(email, phone))')
    .eq('id', id)
    .single()

  if (!asset) {
    notFound()
  }

  // Fetch bookings for this asset
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('asset_id', id)
    .order('created_at', { ascending: false })

  // Fetch maintenance for this asset
  const { data: maintenance } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('asset_id', id)
    .order('created_at', { ascending: false })

  // Fetch expenses for this asset
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('asset_id', id)
    .order('expense_date', { ascending: false })

  // Calculate metrics
  const totalBookings = bookings?.length || 0
  const activeBookings = bookings?.filter(b => b.status === 'active' || b.status === 'confirmed').length || 0
  const totalRevenue = bookings
    ?.filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0
  const netRevenue = totalRevenue - totalExpenses

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    in_use: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-orange-100 text-orange-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/manager/fleet">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Fleet
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{asset.name}</h1>
            <p className="text-gray-500 mt-1">
              {asset.year} {asset.make} {asset.model}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <Badge className={`${statusColors[asset.status]} mb-6`} variant="secondary">
        {asset.status.replace('_', ' ').toUpperCase()}
      </Badge>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalBookings}</p>
                <p className="text-xs text-gray-500 mt-1">{activeBookings} active</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
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
                <p className="text-xs text-gray-500 mt-1">Gross earnings</p>
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
                <p className="text-sm font-medium text-gray-600">Expenses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${totalExpenses.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">{expenses?.length || 0} items</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Wrench className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${netRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">After expenses</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">VIN</p>
              <p className="font-medium">{asset.vin || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">License Plate</p>
              <p className="font-medium">{asset.license_plate || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">RV Type</p>
              <p className="font-medium">{asset.rv_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Year / Make / Model</p>
              <p className="font-medium">
                {asset.year} {asset.make} {asset.model}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Sleeps</span>
              <span className="font-medium">{asset.sleeps} people</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Bedrooms</span>
              <span className="font-medium">{asset.bedrooms || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Bathrooms</span>
              <span className="font-medium">{asset.bathrooms || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Length</span>
              <span className="font-medium">{asset.length_feet} ft</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Weight</span>
              <span className="font-medium">{asset.weight_lbs?.toLocaleString()} lbs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Fuel</span>
              <span className="font-medium">{asset.fuel_type || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Owner */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Owner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Base Price</p>
              <p className="text-2xl font-bold text-indigo-600">
                ${asset.base_price_per_night}/night
              </p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cleaning Fee</span>
              <span className="font-medium">${asset.cleaning_fee}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Security Deposit</span>
              <span className="font-medium">${asset.security_deposit}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Min. Nights</span>
              <span className="font-medium">{asset.minimum_rental_nights}</span>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-gray-500">Owner</p>
              <p className="font-medium">{asset.owners?.business_name}</p>
              <p className="text-xs text-gray-400">{asset.owners?.profiles?.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location & Features */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Location & Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </h4>
              <div className="space-y-2 text-sm">
                <p>{asset.storage_address || asset.city}</p>
                <p>
                  {asset.city}, {asset.state} {asset.zip_code}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {asset.amenities?.map((amenity: string) => (
                  <Badge key={amenity} variant="secondary">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings ({bookings?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings && bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((booking: any) => (
                  <div key={booking.id} className="flex justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{booking.booking_number}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">${Number(booking.total_amount).toLocaleString()}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No bookings yet</p>
            )}
          </CardContent>
        </Card>

        {/* Maintenance & Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance & Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Maintenance Requests ({maintenance?.length || 0})</h4>
                {maintenance && maintenance.length > 0 ? (
                  <div className="space-y-2">
                    {maintenance.slice(0, 3).map((m: any) => (
                      <div key={m.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                        <span>{m.title}</span>
                        <Badge variant="secondary">{m.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No maintenance</p>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-2">Expenses ({expenses?.length || 0})</h4>
                {expenses && expenses.length > 0 ? (
                  <div className="space-y-2">
                    {expenses.slice(0, 3).map((e: any) => (
                      <div key={e.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                        <span>{e.description}</span>
                        <span className="font-medium text-orange-600">${e.amount}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Total</span>
                        <span className="text-orange-600">${totalExpenses.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No expenses</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
