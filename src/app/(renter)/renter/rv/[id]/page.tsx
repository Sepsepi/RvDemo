'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useParams, useRouter } from 'next/navigation'
import {
  MapPin,
  Users,
  Ruler,
  Star,
  Calendar,
  DollarSign,
  MessageSquare,
  Send,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'

export default function RVDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [rv, setRv] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState('')
  const [sending, setSending] = useState(false)
  const [messageSent, setMessageSent] = useState(false)

  useEffect(() => {
    fetchRV()
    fetchUserId()
  }, [])

  async function fetchUserId() {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      setUserId(data.user?.id)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function fetchRV() {
    try {
      const response = await fetch(`/api/assets/${id}`)
      const data = await response.json()
      setRv(data.asset)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function sendMessageToOwner() {
    if (!message.trim() || !userId || !rv) return

    setSending(true)

    try {
      // Get owner's user_id
      const ownerResponse = await fetch(`/api/owners/${rv.owner_id}`)
      const ownerData = await ownerResponse.json()

      if (!ownerData.owner || !ownerData.owner.user_id) {
        alert('Owner contact information not available. Please try again later.')
        setSending(false)
        return
      }

      const messageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_user_id: userId,
          to_user_id: ownerData.owner.user_id,
          asset_id: rv.id,
          subject: `Inquiry about ${rv.name}`,
          message: message,
          message_type: 'booking_inquiry',
        }),
      })

      if (messageResponse.ok) {
        setMessageSent(true)
        setMessage('')
        setTimeout(() => {
          setMessageSent(false)
          router.push('/renter/messages')
        }, 2000)
      } else {
        const error = await messageResponse.json()
        alert(`Failed to send message: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  if (!rv) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p>RV not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/renter/browse">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Browse
        </Button>
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{rv.name}</h1>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>
                  {rv.city}, {rv.state}
                </span>
              </div>
              <Badge variant="outline">{rv.rv_type}</Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">${rv.base_price_per_night}</p>
            <p className="text-gray-500">per night</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Placeholder */}
          <Card>
            <CardContent className="p-0">
              <div className="h-96 bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="text-lg font-medium">RV Photos</p>
                  <p className="text-sm">Coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About this RV</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{rv.description || 'No description provided.'}</p>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Sleeps</p>
                  <p className="font-semibold">{rv.sleeps} people</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Length</p>
                  <p className="font-semibold">{rv.length_feet} ft</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bedrooms</p>
                  <p className="font-semibold">{rv.bedrooms || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bathrooms</p>
                  <p className="font-semibold">{rv.bathrooms || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Year</p>
                  <p className="font-semibold">{rv.year}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Make/Model</p>
                  <p className="font-semibold">
                    {rv.make} {rv.model}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          {rv.amenities && rv.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {rv.amenities.map((amenity: string) => (
                    <div key={amenity} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Booking Card */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Book this RV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold mb-1">${rv.base_price_per_night}</p>
                <p className="text-sm text-gray-500">per night</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cleaning fee</span>
                  <span className="font-medium">${rv.cleaning_fee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Security deposit</span>
                  <span className="font-medium">${rv.security_deposit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Minimum nights</span>
                  <span className="font-medium">{rv.minimum_rental_nights}</span>
                </div>
              </div>

              <Separator />

              <Button className="w-full bg-black hover:bg-gray-800" size="lg">
                <Calendar className="h-4 w-4 mr-2" />
                Reserve Now
              </Button>

              {/* Message Owner Button */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full" size="lg">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Owner
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Contact Owner</DialogTitle>
                    <p className="text-sm text-gray-500">Send a message about this RV</p>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Send a message to the owner of {rv.name}
                      </p>
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Hi! I'm interested in renting this RV. Is it available for..."
                        rows={5}
                        className="resize-none"
                      />
                    </div>

                    {messageSent ? (
                      <div className="text-center py-4">
                        <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-2" />
                        <p className="font-semibold">Message sent!</p>
                        <p className="text-sm text-gray-500">Redirecting to messages...</p>
                      </div>
                    ) : (
                      <Button
                        onClick={sendMessageToOwner}
                        disabled={!message.trim() || sending}
                        className="w-full bg-black hover:bg-gray-800"
                      >
                        {sending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <p className="text-xs text-gray-500 text-center">
                You won't be charged yet
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
