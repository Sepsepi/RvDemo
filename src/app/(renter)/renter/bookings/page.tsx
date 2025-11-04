import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  MapPin,
  DollarSign,
  Eye,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'

export default async function RenterBookingsPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'renter') {
    redirect('/login')
  }

  const supabase = await createClient()

  // Get renter profile (take first if multiple)
  const { data: renterData } = await supabase
    .from('renters')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)

  const renter = renterData?.[0]

  if (!renter) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-900 font-semibold mb-2">Setting up your profile...</p>
              <p className="text-gray-600">
                Your renter profile is being created. Please try again in a moment.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, assets(name, city, state, rv_type, base_price_per_night)')
    .eq('renter_id', renter.id)
    .order('created_at', { ascending: false })

  const upcoming = bookings?.filter(b =>
    new Date(b.start_date) > new Date() && b.status !== 'cancelled'
  ) || []

  const past = bookings?.filter(b =>
    new Date(b.end_date) < new Date() || b.status === 'completed'
  ) || []

  const cancelled = bookings?.filter(b => b.status === 'cancelled') || []

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

  function renderBookingCard(booking: any) {
    return (
      <Card key={booking.id} className="hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                {booking.assets?.name || 'RV'}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{booking.assets?.city}, {booking.assets?.state}</span>
                </div>
                <Badge variant="secondary">{booking.assets?.rv_type}</Badge>
              </div>
            </div>
            <Badge className={statusColors[booking.status]} variant="secondary">
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
              <p className="text-xs text-gray-500">Total Paid</p>
              <p className="text-xl font-bold text-green-600">
                ${Number(booking.total_amount).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {booking.total_nights} nights × ${booking.nightly_rate}/night
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/renter/rv/${booking.asset_id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View RV
                </Button>
              </Link>
              <Link href="/renter/messages">
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-500 mt-1">Manage your RV reservations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-gray-900">{upcoming.length}</p>
            <p className="text-sm text-gray-600 mt-1">Upcoming Trips</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-gray-900">{past.length}</p>
            <p className="text-sm text-gray-600 mt-1">Past Trips</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-gray-900">
              ${bookings?.reduce((sum, b) => sum + Number(b.total_amount || 0), 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total Spent</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Trips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcoming.map(renderBookingCard)}
          </div>
        </div>
      )}

      {/* Past Bookings */}
      {past.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Trips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {past.map(renderBookingCard)}
          </div>
        </div>
      )}

      {/* Empty State */}
      {bookings?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-20 w-20 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Start exploring RVs and book your first adventure!
            </p>
            <Link href="/renter/browse">
              <Button>Browse RVs</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
