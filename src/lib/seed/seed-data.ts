import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

// This script seeds the database with realistic demo data
// Run with: npx tsx src/lib/seed/seed-data.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Demo users - will be created with auth
const demoUsers = [
  {
    email: 'manager@demo.com',
    password: 'demo1234',
    full_name: 'Michael Fleet',
    role: 'manager' as const,
  },
  {
    email: 'owner1@demo.com',
    password: 'demo1234',
    full_name: 'Sarah Johnson',
    role: 'owner' as const,
  },
  {
    email: 'owner2@demo.com',
    password: 'demo1234',
    full_name: 'David Martinez',
    role: 'owner' as const,
  },
  {
    email: 'renter@demo.com',
    password: 'demo1234',
    full_name: 'Emily Chen',
    role: 'renter' as const,
  },
]

// RV data
// No images for now - will use icon placeholders

const rvData = [
  { type: 'Class A', make: 'Newmar', model: 'Dutch Star', year: 2022, length: 43.5, price: 450, sleeps: 6 },
  { type: 'Class A', make: 'Tiffin', model: 'Allegro Bus', year: 2021, length: 40, price: 425, sleeps: 6 },
  { type: 'Class A', make: 'Entegra', model: 'Cornerstone', year: 2023, length: 45, price: 500, sleeps: 8 },
  { type: 'Class C', make: 'Thor', model: 'Four Winds', year: 2022, length: 31, price: 225, sleeps: 6 },
  { type: 'Class C', make: 'Coachmen', model: 'Leprechaun', year: 2021, length: 32, price: 210, sleeps: 6 },
  { type: 'Class C', make: 'Jayco', model: 'Redhawk', year: 2023, length: 29, price: 240, sleeps: 5 },
  { type: 'Class C', make: 'Forest River', model: 'Sunseeker', year: 2022, length: 30, price: 200, sleeps: 6 },
  { type: 'Class C', make: 'Winnebago', model: 'Minnie Winnie', year: 2021, length: 31, price: 215, sleeps: 6 },
  { type: 'Travel Trailer', make: 'Airstream', model: 'Flying Cloud', year: 2022, length: 30, price: 180, sleeps: 4 },
  { type: 'Travel Trailer', make: 'Grand Design', model: 'Imagine', year: 2023, length: 26, price: 140, sleeps: 6 },
  { type: 'Travel Trailer', make: 'Forest River', model: 'Rockwood', year: 2022, length: 28, price: 130, sleeps: 6 },
  { type: 'Travel Trailer', make: 'Jayco', model: 'Jay Flight', year: 2021, length: 32, price: 150, sleeps: 8 },
  { type: 'Travel Trailer', make: 'Keystone', model: 'Passport', year: 2023, length: 24, price: 120, sleeps: 4 },
  { type: 'Travel Trailer', make: 'Coleman', model: 'Lantern', year: 2022, length: 27, price: 125, sleeps: 6 },
  { type: 'Fifth Wheel', make: 'Grand Design', model: 'Reflection', year: 2023, length: 36, price: 280, sleeps: 6 },
  { type: 'Fifth Wheel', make: 'Keystone', model: 'Montana', year: 2022, length: 38, price: 290, sleeps: 8 },
  { type: 'Fifth Wheel', make: 'Forest River', model: 'Cardinal', year: 2021, length: 34, price: 260, sleeps: 6 },
  { type: 'Class B', make: 'Winnebago', model: 'Revel', year: 2023, length: 19.5, price: 320, sleeps: 2 },
  { type: 'Class B', make: 'Airstream', model: 'Interstate', year: 2022, length: 24, price: 340, sleeps: 2 },
  { type: 'Class B', make: 'Pleasure-Way', model: 'Ascent', year: 2023, length: 22, price: 310, sleeps: 2 },
  { type: 'Travel Trailer', make: 'Lance', model: 'Travel Trailers', year: 2022, length: 23, price: 145, sleeps: 4 },
  { type: 'Class C', make: 'Dynamax', model: 'Isata', year: 2023, length: 27, price: 285, sleeps: 4 },
  { type: 'Class A', make: 'Fleetwood', model: 'Discovery', year: 2021, length: 38, price: 380, sleeps: 6 },
  { type: 'Travel Trailer', make: 'Dutchmen', model: 'Aspen Trail', year: 2022, length: 29, price: 135, sleeps: 6 },
  { type: 'Fifth Wheel', make: 'Jayco', model: 'Eagle', year: 2023, length: 35, price: 275, sleeps: 6 },
]

const cities = [
  { name: 'Phoenix', state: 'AZ', lat: 33.4484, lon: -112.0740 },
  { name: 'Denver', state: 'CO', lat: 39.7392, lon: -104.9903 },
  { name: 'Las Vegas', state: 'NV', lat: 36.1699, lon: -115.1398 },
  { name: 'San Diego', state: 'CA', lat: 32.7157, lon: -117.1611 },
  { name: 'Portland', state: 'OR', lat: 45.5152, lon: -122.6784 },
  { name: 'Austin', state: 'TX', lat: 30.2672, lon: -97.7431 },
  { name: 'Seattle', state: 'WA', lat: 47.6062, lon: -122.3321 },
  { name: 'Salt Lake City', state: 'UT', lat: 40.7608, lon: -111.8910 },
]

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n')

  try {
    // Step 1: Create demo users
    console.log('👥 Creating demo users...')
    const userIds: Record<string, string> = {}

    for (const user of demoUsers) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      })

      if (authError) {
        console.log(`  ⚠️  User ${user.email} might already exist, skipping...`)
        // Try to get existing user
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', user.email)
          .single()

        if (existingProfile) {
          userIds[user.email] = existingProfile.id
        }
        continue
      }

      if (authData.user) {
        userIds[user.email] = authData.user.id

        // Create profile
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        })

        console.log(`  ✓ Created ${user.role}: ${user.email}`)
      }
    }

    // Step 2: Create owners
    console.log('\n🏢 Creating asset owners...')
    const ownerIds: string[] = []

    const ownerData = [
      {
        business_name: 'Sunshine RV Rentals',
        user_id: userIds['owner1@demo.com'],
        revenue_split_percentage: 70,
        contract_type: 'standard'
      },
      {
        business_name: 'Mountain View RV Co',
        user_id: userIds['owner2@demo.com'],
        revenue_split_percentage: 75,
        contract_type: 'tiered'
      },
      { business_name: 'Desert Oasis RVs', revenue_split_percentage: 70, contract_type: 'standard' },
      { business_name: 'Pacific Coast Rentals', revenue_split_percentage: 72, contract_type: 'standard' },
      { business_name: 'Rocky Mountain RV', revenue_split_percentage: 75, contract_type: 'premium' },
      { business_name: 'Texas Trail Blazers', revenue_split_percentage: 70, contract_type: 'standard' },
      { business_name: 'Northwest Adventures', revenue_split_percentage: 73, contract_type: 'standard' },
      { business_name: 'Southwest Getaways', revenue_split_percentage: 70, contract_type: 'standard' },
      { business_name: 'Coastal Cruisers LLC', revenue_split_percentage: 72, contract_type: 'standard' },
      { business_name: 'High Desert RV Fleet', revenue_split_percentage: 75, contract_type: 'premium' },
    ]

    for (const owner of ownerData) {
      const { data, error } = await supabase
        .from('owners')
        .insert(owner)
        .select()
        .single()

      if (data) {
        ownerIds.push(data.id)
        console.log(`  ✓ Created owner: ${owner.business_name}`)
      }
    }

    // Step 3: Create renters
    console.log('\n👤 Creating renters...')
    const renterIds: string[] = []

    if (userIds['renter@demo.com']) {
      const { data } = await supabase
        .from('renters')
        .insert({
          user_id: userIds['renter@demo.com'],
          drivers_license_number: 'D1234567',
          drivers_license_state: 'CA',
        })
        .select()
        .single()

      if (data) renterIds.push(data.id)
    }

    // Create additional anonymous renters
    const additionalRenters = [
      { drivers_license_state: 'TX' },
      { drivers_license_state: 'AZ' },
      { drivers_license_state: 'CO' },
      { drivers_license_state: 'WA' },
    ]

    for (const renter of additionalRenters) {
      const { data } = await supabase
        .from('renters')
        .insert(renter)
        .select()
        .single()

      if (data) renterIds.push(data.id)
    }

    console.log(`  ✓ Created ${renterIds.length} renters`)

    // Step 4: Create assets (RVs)
    console.log('\n🚐 Creating RV fleet...')
    const assetIds: string[] = []

    for (let i = 0; i < rvData.length; i++) {
      const rv = rvData[i]
      const owner = ownerIds[i % ownerIds.length]
      const city = cities[i % cities.length]

      const { data, error } = await supabase
        .from('assets')
        .insert({
          owner_id: owner,
          name: `${rv.year} ${rv.make} ${rv.model}`,
          description: `Beautiful ${rv.type} perfect for your next adventure. Sleeps ${rv.sleeps} comfortably.`,
          status: i < 20 ? 'available' : i < 23 ? 'in_use' : 'maintenance',
          year: rv.year,
          make: rv.make,
          model: rv.model,
          rv_type: rv.type,
          length_feet: rv.length,
          sleeps: rv.sleeps,
          bedrooms: Math.floor(rv.sleeps / 2),
          bathrooms: rv.sleeps > 4 ? 1.5 : 1,
          fuel_type: rv.type.includes('Travel Trailer') || rv.type.includes('Fifth Wheel') ? null : 'Diesel',
          transmission: rv.type.includes('Travel Trailer') || rv.type.includes('Fifth Wheel') ? null : 'Automatic',
          city: city.name,
          state: city.state,
          latitude: city.lat,
          longitude: city.lon,
          base_price_per_night: rv.price,
          cleaning_fee: 75,
          security_deposit: 500,
          minimum_rental_nights: 2,
          amenities: [
            'Full Kitchen',
            'Bathroom',
            'AC/Heating',
            'WiFi',
            rv.sleeps > 5 ? 'Multiple Beds' : 'Queen Bed',
            'Solar Panels',
            'Awning',
          ],
          features: {
            slide_outs: rv.length > 30 ? 2 : rv.length > 25 ? 1 : 0,
            generator: !rv.type.includes('Travel Trailer'),
            solar: true,
            backup_camera: true,
          },
        })
        .select()
        .single()

      if (data) {
        assetIds.push(data.id)
      }
    }

    console.log(`  ✓ Created ${assetIds.length} RVs`)

    // Step 5: Create bookings
    console.log('\n📅 Creating bookings...')
    const bookingIds: string[] = []

    // Create 60 bookings with various statuses
    for (let i = 0; i < 60; i++) {
      const asset = assetIds[Math.floor(Math.random() * assetIds.length)]
      const renter = renterIds[Math.floor(Math.random() * renterIds.length)]

      // Get asset details for pricing
      const { data: assetData } = await supabase
        .from('assets')
        .select('base_price_per_night, cleaning_fee, owner_id')
        .eq('id', asset)
        .single()

      if (!assetData) continue

      // Random date in the past 6 months or next 3 months
      const daysOffset = Math.floor(Math.random() * 270) - 180
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + daysOffset)

      const nights = Math.floor(Math.random() * 10) + 2 // 2-12 nights
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + nights)

      const nightly_rate = assetData.base_price_per_night
      const subtotal = nightly_rate * nights
      const cleaning_fee = assetData.cleaning_fee
      const platform_fee = subtotal * 0.1
      const total = subtotal + cleaning_fee + platform_fee

      // Determine status based on date
      let status: string
      if (daysOffset < -14) {
        status = 'completed'
      } else if (daysOffset < -7) {
        status = Math.random() > 0.5 ? 'completed' : 'checked_out'
      } else if (daysOffset < 0) {
        status = 'active'
      } else if (daysOffset < 7) {
        status = 'confirmed'
      } else {
        status = 'inquiry'
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          booking_number: `BK-${Date.now()}-${i}`,
          asset_id: asset,
          renter_id: renter,
          owner_id: assetData.owner_id,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          total_nights: nights,
          nightly_rate,
          subtotal,
          cleaning_fee,
          platform_fee,
          total_amount: total,
          status,
        })
        .select()
        .single()

      if (data) {
        bookingIds.push(data.id)

        // Create transaction for completed bookings
        if (status === 'completed') {
          await supabase.from('transactions').insert({
            booking_id: data.id,
            asset_id: asset,
            owner_id: assetData.owner_id,
            renter_id: renter,
            transaction_type: 'rental_income',
            amount: total,
            description: `Rental income for booking ${data.booking_number}`,
            status: 'completed',
            transaction_date: endDate.toISOString().split('T')[0],
          })
        }
      }
    }

    console.log(`  ✓ Created ${bookingIds.length} bookings`)

    // Step 6: Create maintenance requests
    console.log('\n🔧 Creating maintenance requests...')

    const maintenanceTypes = [
      { title: 'Oil Change Required', priority: 'medium', category: 'mechanical' },
      { title: 'AC Unit Not Cooling', priority: 'high', category: 'hvac' },
      { title: 'Tire Replacement Needed', priority: 'high', category: 'mechanical' },
      { title: 'Water Heater Issue', priority: 'medium', category: 'plumbing' },
      { title: 'Generator Service', priority: 'low', category: 'mechanical' },
      { title: 'Awning Repair', priority: 'low', category: 'cosmetic' },
      { title: 'Slide-out Motor Check', priority: 'medium', category: 'mechanical' },
      { title: 'Brake Inspection', priority: 'high', category: 'safety' },
      { title: 'Interior Deep Clean', priority: 'low', category: 'cleaning' },
      { title: 'Solar Panel Check', priority: 'low', category: 'electrical' },
    ]

    for (let i = 0; i < 15; i++) {
      const asset = assetIds[Math.floor(Math.random() * assetIds.length)]
      const maintenance = maintenanceTypes[i % maintenanceTypes.length]

      const { data: assetData } = await supabase
        .from('assets')
        .select('owner_id')
        .eq('id', asset)
        .single()

      if (!assetData) continue

      const status = i < 5 ? 'requested' : i < 8 ? 'scheduled' : i < 12 ? 'in_progress' : 'completed'

      await supabase.from('maintenance_requests').insert({
        ticket_number: `MX-${Date.now()}-${i}`,
        asset_id: asset,
        owner_id: assetData.owner_id,
        title: maintenance.title,
        description: `Regular maintenance required for ${maintenance.title}`,
        priority: maintenance.priority,
        category: maintenance.category,
        status,
        estimated_cost: Math.floor(Math.random() * 500) + 100,
      })
    }

    console.log('  ✓ Created 15 maintenance requests')

    // Step 7: Create expenses
    console.log('\n💰 Creating expenses...')

    for (let i = 0; i < 30; i++) {
      const asset = assetIds[Math.floor(Math.random() * assetIds.length)]

      const { data: assetData } = await supabase
        .from('assets')
        .select('owner_id')
        .eq('id', asset)
        .single()

      if (!assetData) continue

      const categories = ['maintenance', 'repair', 'cleaning', 'insurance', 'fuel']
      const category = categories[Math.floor(Math.random() * categories.length)]
      const amount = Math.floor(Math.random() * 800) + 50

      await supabase.from('expenses').insert({
        asset_id: asset,
        owner_id: assetData.owner_id,
        category,
        amount,
        description: `${category.charAt(0).toUpperCase() + category.slice(1)} expense`,
        vendor: `${category.charAt(0).toUpperCase() + category.slice(1)} Vendor LLC`,
        status: i < 25 ? 'approved' : 'pending',
        expense_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
    }

    console.log('  ✓ Created 30 expenses')

    console.log('\n✅ Database seeded successfully!')
    console.log('\n📊 Summary:')
    console.log(`  - ${demoUsers.length} users`)
    console.log(`  - ${ownerIds.length} owners`)
    console.log(`  - ${assetIds.length} RVs`)
    console.log(`  - ${bookingIds.length} bookings`)
    console.log(`  - 15 maintenance requests`)
    console.log(`  - 30 expenses`)
    console.log('\n🎉 Your dashboard should now be full of data!')
    console.log('\n🔑 Demo Login Credentials:')
    console.log('   Manager: manager@demo.com / demo1234')
    console.log('   Owner:   owner1@demo.com / demo1234')
    console.log('   Renter:  renter@demo.com / demo1234')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

// Run the seed
seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
