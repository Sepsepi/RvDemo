import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Mail, Phone, MapPin, Calendar, DollarSign, Star } from 'lucide-react'

export default async function RenterProfilePage() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'renter') {
    redirect('/login')
  }

  const supabase = await createClient()

  // Get renter profile
  const { data: renter } = await supabase
    .from('renters')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Get booking stats
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('renter_id', renter?.id)

  const totalBookings = bookings?.length || 0
  const totalSpent = bookings?.reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-10 w-10 text-gray-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.full_name || 'Renter'}</h2>
                <Badge variant="outline">Renter</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium">{user.phone || 'Not provided'}</p>
                </div>
              </div>

              {renter?.city && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-medium">
                      {renter.city}, {renter.state}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Member Since</p>
                  <p className="font-medium">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button variant="outline" className="w-full">Edit Profile</Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Trips</p>
              <p className="text-3xl font-bold">{totalBookings}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Spent</p>
              <p className="text-2xl font-bold">${totalSpent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Average Rating</p>
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <p className="text-xl font-bold">{renter?.average_rating || '5.0'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
