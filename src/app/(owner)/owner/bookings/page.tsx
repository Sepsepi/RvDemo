import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, DollarSign, User } from 'lucide-react'

export default async function OwnerBookingsPage() {
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

  // Get all bookings for this owner's RVs
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, assets(name, city, state, rv_type)')
    .eq('owner_id', owner.id)
    .order('created_at', { ascending: false })

  const upcoming = bookings?.filter(b =>
    new Date(b.start_date) > new Date() && b.status !== 'cancelled'
  ) || []

  const active = bookings?.filter(b => b.status === 'active' || b.status === 'checked_in') || []
  const completed = bookings?.filter(b => b.status === 'completed') || []

  const statusColors: Record<string, string> = {
    inquiry: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    checked_in: 'bg-purple-100 text-purple-800',
    active: 'bg-green-100 text-green-800',
    checked_out: 'bg-orange-100 text-orange-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Bookings for Your RVs</h1>
        <p className="text-gray-500 mt-1">Track all reservations across your fleet</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{bookings?.length || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Total Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-600">{active.length}</p>
            <p className="text-sm text-gray-600 mt-1">Active Now</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-blue-600">{upcoming.length}</p>
            <p className="text-sm text-gray-600 mt-1">Upcoming</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-gray-600">{completed.length}</p>
            <p className="text-sm text-gray-600 mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Bookings */}
      {active.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Active Rentals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {active.map((booking: any) => (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{booking.assets?.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{booking.assets?.city}, {booking.assets?.state}</span>
                      </div>
                    </div>
                    <Badge className={statusColors[booking.status]}>
                      {booking.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Check-in</p>
                      <p className="font-medium">{formatDate(booking.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Check-out</p>
                      <p className="font-medium">{formatDate(booking.end_date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Booking Number</p>
                      <p className="font-medium text-sm">{booking.booking_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">
                        ${Number(booking.total_amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Bookings */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Upcoming Rentals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcoming.map((booking: any) => (
              <Card key={booking.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{booking.assets?.name}</h3>
                      <p className="text-sm text-gray-500">{booking.booking_number}</p>
                    </div>
                    <Badge className={statusColors[booking.status]}>
                      {booking.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dates:</span>
                      <span className="font-medium">
                        {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nights:</span>
                      <span className="font-medium">{booking.total_nights}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold">${Number(booking.total_amount).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Bookings */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Completed Rentals</h2>
          <div className="grid grid-cols-1 gap-4">
            {completed.slice(0, 10).map((booking: any) => (
              <Card key={booking.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold">{booking.assets?.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${Number(booking.total_amount).toLocaleString()}</p>
                      <Badge className={statusColors[booking.status]} variant="secondary">
                        Completed
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {bookings?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-20 w-20 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium mb-2">No bookings yet</h3>
            <p className="text-gray-500 text-center">
              Bookings for your RVs will appear here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
