import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Truck,
  MapPin,
  DollarSign,
  Calendar,
  Wrench,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  FileText,
  Users,
} from 'lucide-react'
import Link from 'next/link'

export default async function OwnerAssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user || user.role !== 'owner') {
    redirect('/login')
  }

  const supabase = await createClient()

  // Get owner
  const { data: ownerData } = await supabase
    .from('owners')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)

  const owner = ownerData?.[0]

  if (!owner) {
    return <div className="p-8"><p>Owner not found</p></div>
  }

  // Get asset
  const { data: asset } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .eq('owner_id', owner.id)
    .single()

  if (!asset) {
    notFound()
  }

  // Get related data
  const [
    { data: bookings },
    { data: maintenance },
    { data: expenses },
    { data: inspections },
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('*')
      .eq('asset_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('maintenance_requests')
      .select('*')
      .eq('asset_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('expenses')
      .select('*')
      .eq('asset_id', id)
      .order('expense_date', { ascending: false }),
    supabase
      .from('inspections')
      .select('*')
      .eq('asset_id', id)
      .order('inspection_date', { ascending: false })
      .limit(1),
  ])

  // Calculate metrics
  const totalBookings = bookings?.length || 0
  const activeBookings = bookings?.filter(b => b.status === 'active' || b.status === 'confirmed').length || 0
  const revenue = bookings
    ?.filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0
  const netRevenue = revenue - totalExpenses

  const recentInspection = inspections?.[0]
  const pendingMaintenance = maintenance?.filter(m => m.status !== 'completed' && m.status !== 'cancelled').length || 0

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    in_use: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-orange-100 text-orange-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/owner/assets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My RVs
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{asset.name}</h1>
            <p className="text-gray-500 mt-1">
              {asset.year} {asset.make} {asset.model} • {asset.rv_type}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className={statusColors[asset.status]} variant="secondary">
            {asset.status.replace('_', ' ').toUpperCase()}
          </Badge>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Details
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  ${revenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Lifetime earnings</p>
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
                <p className="text-sm font-medium text-gray-600">Bookings</p>
                <p className="text-2xl font-bold mt-1">{totalBookings}</p>
                <p className="text-xs text-gray-500 mt-1">{activeBookings} active now</p>
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
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold mt-1">${netRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">After expenses</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold mt-1">{pendingMaintenance}</p>
                <p className="text-xs text-gray-500 mt-1">Pending items</p>
              </div>
              <div className={`p-3 rounded-lg ${pendingMaintenance > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <Wrench className={`h-6 w-6 ${pendingMaintenance > 0 ? 'text-orange-600' : 'text-gray-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Condition */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Condition & Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Last Inspection */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Last Inspection
              </h4>
              {recentInspection ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{formatDateTime(recentInspection.inspection_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Exterior:</span>
                    <Badge variant="outline" className="text-xs">
                      {recentInspection.exterior_condition}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interior:</span>
                    <Badge variant="outline" className="text-xs">
                      {recentInspection.interior_condition}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mechanical:</span>
                    <Badge variant="outline" className="text-xs">
                      {recentInspection.mechanical_condition}
                    </Badge>
                  </div>
                  {recentInspection.damages_found && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs text-red-800 font-semibold">
                        ⚠️ Damage reported
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent inspection</p>
              )}
            </div>

            {/* Current Status */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Current Status
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Availability:</span>
                  <Badge className={statusColors[asset.status]}>
                    {asset.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{asset.city}, {asset.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mileage:</span>
                  <span className="font-medium">{asset.mileage?.toLocaleString() || 'N/A'} mi</span>
                </div>
                {recentInspection?.mileage && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Check:</span>
                    <span className="font-medium">{recentInspection.mileage.toLocaleString()} mi</span>
                  </div>
                )}
              </div>
            </div>

            {/* Alerts */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Alerts & Notifications
              </h4>
              <div className="space-y-2">
                {pendingMaintenance > 0 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm font-semibold text-orange-800">
                      {pendingMaintenance} Maintenance Item{pendingMaintenance > 1 ? 's' : ''} Pending
                    </p>
                  </div>
                )}
                {activeBookings > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800">
                      {activeBookings} Active Booking{activeBookings > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
                {!pendingMaintenance && !activeBookings && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-semibold text-green-800">
                      ✓ All systems operational
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specifications & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Specs */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">VIN</p>
                <p className="font-medium text-sm">{asset.vin || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">License Plate</p>
                <p className="font-medium text-sm">{asset.license_plate || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Length</p>
                <p className="font-medium">{asset.length_feet} ft</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sleeps</p>
                <p className="font-medium">{asset.sleeps} people</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bedrooms</p>
                <p className="font-medium">{asset.bedrooms || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bathrooms</p>
                <p className="font-medium">{asset.bathrooms || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fuel Type</p>
                <p className="font-medium">{asset.fuel_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Transmission</p>
                <p className="font-medium">{asset.transmission || 'N/A'}</p>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Amenities */}
            {asset.amenities && asset.amenities.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {asset.amenities.map((amenity: string) => (
                    <Badge key={amenity} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing & Insurance */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Insurance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Base Rate</p>
                <p className="text-3xl font-bold">${asset.base_price_per_night}/night</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cleaning Fee:</span>
                  <span className="font-medium">${asset.cleaning_fee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Security Deposit:</span>
                  <span className="font-medium">${asset.security_deposit}</span>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Insurance</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Policy #:</span>
                    <span className="font-medium">{asset.insurance_policy_number || 'Not on file'}</span>
                  </div>
                  {asset.insurance_expiry_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expires:</span>
                      <span className="font-medium">{formatDate(asset.insurance_expiry_date)}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Registration</h4>
                <div className="space-y-2 text-sm">
                  {asset.registration_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Registration #:</span>
                      <span className="font-medium">{asset.registration_number}</span>
                    </div>
                  )}
                  {asset.registration_expiry_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expires:</span>
                      <span className="font-medium">{formatDate(asset.registration_expiry_date)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Bookings</CardTitle>
              <Badge variant="outline">{totalBookings} total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {bookings && bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((booking: any) => (
                  <div key={booking.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{booking.booking_number}</p>
                      <Badge className={statusColors[booking.status] || 'bg-gray-100 text-gray-800'}>
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{formatDate(booking.start_date)} - {formatDate(booking.end_date)}</span>
                      <span className="font-semibold text-gray-900">
                        ${Number(booking.total_amount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">No bookings yet</p>
            )}
          </CardContent>
        </Card>

        {/* Maintenance History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Maintenance History</CardTitle>
              <Badge variant="outline">{maintenance?.length || 0} total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {maintenance && maintenance.length > 0 ? (
              <div className="space-y-3">
                {maintenance.slice(0, 5).map((m: any) => (
                  <div key={m.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{m.title}</p>
                      <Badge variant="outline" className="text-xs">
                        {m.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{formatDate(m.created_at)}</span>
                      {m.actual_cost && (
                        <span className="font-semibold text-orange-600">
                          ${Number(m.actual_cost).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">No maintenance records</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expenses */}
      {expenses && expenses.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Expenses & Deductions</CardTitle>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-xl font-bold text-orange-600">${totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expenses.slice(0, 5).map((expense: any) => (
                <div key={expense.id} className="flex justify-between p-3 border rounded-lg text-sm">
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-xs text-gray-500">{formatDate(expense.expense_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">${Number(expense.amount).toLocaleString()}</p>
                    <Badge variant="outline" className="text-xs mt-1">{expense.category}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
