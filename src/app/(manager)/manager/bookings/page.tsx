import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
} from 'lucide-react'
import Link from 'next/link'

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Build query with filters
  let query = supabase
    .from('bookings')
    .select('*, assets(name, rv_type), renters(user_id), owners(business_name)')
    .order('created_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.search) {
    query = query.ilike('booking_number', `%${params.search}%`)
  }

  const { data: bookings } = await query

  // Get stats
  const totalBookings = bookings?.length || 0
  const activeBookings = bookings?.filter(b => b.status === 'active' || b.status === 'confirmed').length || 0
  const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0
  const totalRevenue = bookings
    ?.filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0

  const statusColors: Record<string, string> = {
    inquiry: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    checked_in: 'bg-purple-100 text-purple-800',
    active: 'bg-green-100 text-green-800',
    checked_out: 'bg-orange-100 text-orange-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const statusIcons: Record<string, any> = {
    inquiry: Clock,
    confirmed: CheckCircle,
    checked_in: Calendar,
    active: Calendar,
    checked_out: Calendar,
    completed: CheckCircle,
    cancelled: XCircle,
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function calculateNightsBetween(start: string, end: string) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings Management</h1>
          <p className="text-gray-500 mt-1">Track all rental reservations and their lifecycle</p>
        </div>
        <Link href="/manager/bookings/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalBookings}</p>
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
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{activeBookings}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{completedBookings}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search booking number..."
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
                <SelectItem value="inquiry">Inquiry</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="checked_out">Checked Out</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Input type="date" placeholder="Start Date" />

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      {bookings && bookings.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Booking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      RV
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nights
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking: any) => {
                    const StatusIcon = statusIcons[booking.status] || Calendar
                    return (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-indigo-100 rounded">
                              <Calendar className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {booking.booking_number}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(booking.created_at)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            {booking.assets?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">{booking.assets?.rv_type}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {booking.owners?.business_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{formatDate(booking.start_date)}</p>
                          <p className="text-xs text-gray-500">to {formatDate(booking.end_date)}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {booking.total_nights} nights
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-900">
                            ${Number(booking.total_amount || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            ${Number(booking.nightly_rate || 0)}/night
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            className={statusColors[booking.status] || 'bg-gray-100 text-gray-800'}
                            variant="secondary"
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {booking.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/manager/bookings/${booking.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500 text-center mb-6">
              {params.status || params.search
                ? 'Try adjusting your filters'
                : 'Get started by creating your first booking'}
            </p>
            <Link href="/manager/bookings/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
