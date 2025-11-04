'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Users,
  Ruler,
  Star,
  Calendar,
  Truck,
} from 'lucide-react'
import Link from 'next/link'

export default function RenterBrowse() {
  const [allRvs, setAllRvs] = useState<any[]>([])
  const [filteredRvs, setFilteredRvs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchLocation, setSearchLocation] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  useEffect(() => {
    fetchRVs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [allRvs, searchLocation, selectedType, minPrice, maxPrice])

  async function fetchRVs() {
    try {
      const response = await fetch('/api/assets?status=available')
      const data = await response.json()
      setAllRvs(data.assets || [])
      setFilteredRvs(data.assets || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = [...allRvs]

    // Location filter
    if (searchLocation) {
      filtered = filtered.filter(rv =>
        rv.city?.toLowerCase().includes(searchLocation.toLowerCase()) ||
        rv.state?.toLowerCase().includes(searchLocation.toLowerCase())
      )
    }

    // Type filter
    if (selectedType && selectedType !== 'all') {
      filtered = filtered.filter(rv => rv.rv_type === selectedType)
    }

    // Price filters
    if (minPrice) {
      filtered = filtered.filter(rv => rv.base_price_per_night >= parseFloat(minPrice))
    }

    if (maxPrice) {
      filtered = filtered.filter(rv => rv.base_price_per_night <= parseFloat(maxPrice))
    }

    setFilteredRvs(filtered)
  }

  const rvTypes = [...new Set(allRvs.map(rv => rv.rv_type).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-black text-white py-16 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Find Your Perfect RV</h1>
          <p className="text-xl text-gray-400 mb-8">
            {filteredRvs.length} available RVs ready to book
          </p>

          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Where are you going?"
                    className="pl-10"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                </div>

                <Select value={selectedType} onValueChange={setSelectedType}>
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

                <Input
                  type="number"
                  placeholder="Min Price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max Price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>

              {(searchLocation || selectedType !== 'all' || minPrice || maxPrice) && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchLocation('')
                    setSelectedType('all')
                    setMinPrice('')
                    setMaxPrice('')
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredRvs.length} RVs Available
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredRvs.length !== allRvs.length &&
                `Filtered from ${allRvs.length} total RVs`}
            </p>
          </div>
          <Button variant="outline">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Sort by Price
          </Button>
        </div>

        {/* RV Grid */}
        {filteredRvs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRvs.map((rv: any) => (
              <Link key={rv.id} href={`/renter/rv/${rv.id}`} className="block">
                <Card className="hover:shadow-xl transition-all cursor-pointer h-full">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-600 flex flex-col items-center justify-center text-white">
                      <Truck className="h-16 w-16 mb-2 opacity-50" />
                      <p className="text-sm font-medium">{rv.rv_type}</p>
                      <p className="text-xs opacity-75">{rv.year}</p>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <Badge className="bg-white text-gray-900 shadow-lg">
                        {rv.rv_type}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="pt-4">
                    {/* Title */}
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{rv.name}</h3>
                    <div className="flex items-center gap-1 mb-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        {rv.city}, {rv.state}
                      </p>
                    </div>

                    {/* Specs */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <Users className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                        <p className="text-xs text-gray-600">Sleeps {rv.sleeps}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <Ruler className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                        <p className="text-xs text-gray-600">{rv.length_feet} ft</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <Star className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
                        <p className="text-xs text-gray-600">5.0</p>
                      </div>
                    </div>

                    {/* Amenities */}
                    {rv.amenities && rv.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {rv.amenities.slice(0, 3).map((amenity: string) => (
                          <span
                            key={amenity}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                          >
                            {amenity}
                          </span>
                        ))}
                        {rv.amenities.length > 3 && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            +{rv.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price & CTA */}
                    <div className="pt-4 border-t flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          ${rv.base_price_per_night}
                          <span className="text-sm font-normal text-gray-500">/night</span>
                        </p>
                        {rv.cleaning_fee && (
                          <p className="text-xs text-gray-500">+ ${rv.cleaning_fee} cleaning fee</p>
                        )}
                      </div>
                      <div className="text-sm font-medium text-black hover:underline">
                        View Details →
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="h-20 w-20 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No RVs match your filters</h3>
              <p className="text-gray-500 text-center mb-6">
                Try adjusting your search criteria
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchLocation('')
                  setSelectedType('all')
                  setMinPrice('')
                  setMaxPrice('')
                }}
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
