import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Truck,
  MapPin,
  Clock,
  FileText,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      assets(*),
      renters(*, profiles(full_name, email, phone)),
      owners(business_name, revenue_split_percentage),
      inspections(*),
      transactions(*)
    `)
    .eq('id', id)
    .single()

  if (!booking) {
    notFound()
  }

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
      month: 'long',
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

  const timeline = [
    { label: 'Booked', date: booking.created_at, completed: true },
    { label: 'Confirmed', date: booking.status === 'confirmed' || booking.status === 'active' || booking.status === 'completed', completed: booking.status !== 'inquiry' },
    { label: 'Check-in', date: booking.actual_checkin_time, completed: booking.actual_checkin_time !== null },
    { label: 'Active', date: booking.status === 'active' || booking.status === 'completed', completed: booking.status === 'active' || booking.status === 'completed' },
    { label: 'Check-out', date: booking.actual_checkout_time, completed: booking.actual_checkout_time !== null },
    { label: 'Completed', date: booking.status === 'completed', completed: booking.status === 'completed' },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/manager/bookings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{booking.booking_number}</h1>
            <p className="text-gray-500 mt-1">Booking Details</p>
          </div>
        </div>
        <Badge className={statusColors[booking.status]} variant="secondary">
          {booking.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Booking Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {timeline.map((step, index) => (
              <div key={step.label} className="flex flex-col items-center">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    step.completed
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Clock className="h-5 w-5" />
                  )}
                </div>
                <p className="text-xs font-medium mt-2">{step.label}</p>
                {step.date && typeof step.date === 'string' && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDateTime(step.date)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* RV Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              RV Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Vehicle</p>
              <p className="font-semibold">{booking.assets?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium">{booking.assets?.rv_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium">
                {booking.assets?.city}, {booking.assets?.state}
              </p>
            </div>
            <Link href={`/manager/fleet/${booking.asset_id}`}>
              <Button variant="outline" size="sm" className="w-full mt-2">
                View RV Details
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Rental Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rental Period
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Check-in</p>
              <p className="font-semibold">{formatDate(booking.start_date)}</p>
              {booking.actual_checkin_time && (
                <p className="text-xs text-gray-500">
                  Actual: {formatDateTime(booking.actual_checkin_time)}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Check-out</p>
              <p className="font-semibold">{formatDate(booking.end_date)}</p>
              {booking.actual_checkout_time && (
                <p className="text-xs text-gray-500">
                  Actual: {formatDateTime(booking.actual_checkout_time)}
                </p>
              )}
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-500">Total Nights</p>
              <p className="text-2xl font-bold text-indigo-600">{booking.total_nights}</p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nightly Rate</span>
              <span className="font-medium">${booking.nightly_rate}/night</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal ({booking.total_nights} nights)</span>
              <span className="font-medium">${Number(booking.subtotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cleaning Fee</span>
              <span className="font-medium">${booking.cleaning_fee}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform Fee</span>
              <span className="font-medium">${booking.platform_fee}</span>
            </div>
            <Separator />
            <div className="flex justify-between pt-2">
              <span className="font-semibold">Total Amount</span>
              <span className="text-2xl font-bold text-green-600">
                ${Number(booking.total_amount).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Renter & Owner Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Renter Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {booking.renters?.profiles ? (
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{booking.renters.profiles.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{booking.renters.profiles.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{booking.renters.profiles.phone || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No renter information</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Owner Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Business Name</p>
                <p className="font-medium">{booking.owners?.business_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Revenue Split</p>
                <p className="font-medium">{booking.owners?.revenue_split_percentage}% to owner</p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-500">Owner Earnings (Est.)</p>
                <p className="text-xl font-bold text-purple-600">
                  ${Math.round((Number(booking.total_amount) * 0.9 * (booking.owners?.revenue_split_percentage || 70)) / 100).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
