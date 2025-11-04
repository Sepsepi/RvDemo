// Database Types for Consignments.ai Platform
// Auto-generated type definitions matching Supabase schema

export type UserRole = 'manager' | 'owner' | 'renter' | 'admin'
export type AssetStatus = 'available' | 'in_use' | 'maintenance' | 'inactive' | 'pending_approval'
export type BookingStatus = 'inquiry' | 'confirmed' | 'checked_in' | 'active' | 'checked_out' | 'completed' | 'cancelled'
export type MaintenanceStatus = 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type DocumentType =
  | 'rental_receipt'
  | 'maintenance_receipt'
  | 'cleaning_invoice'
  | 'insurance_policy'
  | 'vehicle_registration'
  | 'consignment_contract'
  | 'rental_agreement'
  | 'inspection_report'
  | 'damage_report'
  | 'owner_statement'
  | 'payment_receipt'
  | 'other'

export type TransactionType =
  | 'rental_income'
  | 'maintenance'
  | 'cleaning'
  | 'insurance'
  | 'platform_fee'
  | 'damage'
  | 'refund'
  | 'remittance'

export type ExpenseCategory =
  | 'maintenance'
  | 'repair'
  | 'cleaning'
  | 'insurance'
  | 'registration'
  | 'storage'
  | 'fuel'
  | 'other'

export interface Profile {
  id: string
  email: string
  full_name?: string
  phone?: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Owner {
  id: string
  user_id?: string
  business_name?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  tax_id?: string
  bank_account_info?: Record<string, any>
  preferred_payout_method?: string

  // Contract terms
  revenue_split_percentage: number
  platform_fee_percentage: number
  contract_type?: string
  contract_terms?: Record<string, any>
  expense_cap_monthly?: number
  minimum_guarantee_monthly?: number

  status?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  owner_id: string

  // Basic Info
  name: string
  description?: string
  status: AssetStatus

  // Vehicle Details
  year?: number
  make?: string
  model?: string
  vin?: string
  license_plate?: string
  rv_type?: string
  length_feet?: number
  weight_lbs?: number

  // Specifications
  sleeps?: number
  bedrooms?: number
  bathrooms?: number
  fuel_type?: string
  mileage?: number
  transmission?: string

  // Features
  features?: Record<string, any>
  amenities?: string[]

  // Location
  storage_location?: string
  storage_address?: string
  city?: string
  state?: string
  zip_code?: string
  latitude?: number
  longitude?: number

  // Pricing
  base_price_per_night: number
  cleaning_fee?: number
  security_deposit?: number
  minimum_rental_nights?: number

  // Insurance
  insurance_policy_number?: string
  insurance_expiry_date?: string

  // Registration
  registration_number?: string
  registration_expiry_date?: string

  // Images
  primary_image_url?: string
  image_urls?: string[]

  // Tracking
  total_bookings?: number
  total_revenue?: number
  average_rating?: number

  created_at: string
  updated_at: string
}

export interface Renter {
  id: string
  user_id?: string

  // Personal Info
  drivers_license_number?: string
  drivers_license_state?: string
  drivers_license_expiry?: string
  date_of_birth?: string

  // Contact
  address?: string
  city?: string
  state?: string
  zip_code?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string

  // Stats
  total_bookings?: number
  total_spent?: number
  average_rating?: number

  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  booking_number: string

  // Relationships
  asset_id: string
  renter_id?: string
  owner_id?: string

  // Dates
  start_date: string
  end_date: string
  total_nights: number

  // Pricing
  nightly_rate: number
  subtotal: number
  cleaning_fee?: number
  security_deposit?: number
  platform_fee?: number
  total_amount: number

  // Status
  status: BookingStatus

  // Check-in/out
  actual_checkin_time?: string
  actual_checkout_time?: string
  checkin_mileage?: number
  checkout_mileage?: number

  // Notes
  special_requests?: string
  internal_notes?: string

  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string

  // Relationships
  booking_id?: string
  asset_id?: string
  owner_id?: string
  renter_id?: string

  // Transaction Details
  transaction_type: TransactionType
  amount: number
  description?: string

  // Categorization
  category?: string
  subcategory?: string

  // Reference
  reference_number?: string
  payment_method?: string

  // Status
  status?: string

  // Documents
  receipt_url?: string
  document_id?: string

  // Dates
  transaction_date: string
  created_at: string
}

export interface Expense {
  id: string

  // Relationships
  asset_id: string
  owner_id?: string
  maintenance_request_id?: string

  // Expense Details
  category: ExpenseCategory
  amount: number
  description: string
  vendor?: string

  // Approval
  status?: string
  approved_by?: string
  approved_at?: string

  // Payment
  paid_to?: string
  payment_method?: string
  payment_date?: string

  // Deduction
  deduct_from_owner?: boolean
  deducted_amount?: number
  owner_responsible_percentage?: number

  // Documents
  receipt_url?: string
  document_ids?: string[]

  // Dates
  expense_date: string
  created_at: string
  updated_at: string
}

export interface Remittance {
  id: string
  remittance_number: string

  // Relationships
  owner_id: string

  // Period
  period_start: string
  period_end: string

  // Calculations
  gross_rental_income?: number
  platform_fees?: number
  cleaning_fees?: number
  maintenance_expenses?: number
  other_expenses?: number
  total_deductions?: number
  net_income?: number
  owner_split_percentage: number
  owner_payout_amount: number

  // Itemization
  booking_ids?: string[]
  expense_ids?: string[]
  transaction_ids?: string[]

  // Payment
  status?: string
  payment_method?: string
  payment_date?: string
  payment_reference?: string

  // Documents
  statement_pdf_url?: string
  generated_at?: string
  sent_at?: string

  // Notes
  notes?: string

  created_at: string
  updated_at: string
}

export interface Document {
  id: string

  // Relationships
  asset_id?: string
  owner_id?: string
  booking_id?: string
  renter_id?: string
  expense_id?: string

  // Document Details
  document_type: DocumentType
  title: string
  description?: string
  file_name: string
  file_url: string
  file_size?: number
  mime_type?: string

  // Metadata
  document_date?: string
  uploaded_by?: string

  // Organization
  tags?: string[]
  category?: string

  // Status
  status?: string

  created_at: string
  updated_at: string
}

export interface MaintenanceRequest {
  id: string
  ticket_number: string

  // Relationships
  asset_id: string
  owner_id?: string
  reported_by?: string
  assigned_to?: string

  // Request Details
  title: string
  description: string
  priority?: string
  category?: string

  // Status
  status: MaintenanceStatus

  // Scheduling
  scheduled_date?: string
  completion_date?: string

  // Cost
  estimated_cost?: number
  actual_cost?: number

  // Vendor
  vendor_name?: string
  vendor_contact?: string

  // Resolution
  resolution_notes?: string

  // Images
  before_images?: string[]
  after_images?: string[]

  created_at: string
  updated_at: string
}

export interface Inspection {
  id: string

  // Relationships
  booking_id: string
  asset_id?: string

  // Type
  inspection_type: string // checkin, checkout

  // Inspector
  inspector_id?: string
  inspection_date: string

  // Mileage
  mileage?: number
  fuel_level?: string

  // Condition
  exterior_condition?: string
  interior_condition?: string
  mechanical_condition?: string

  // Detailed Checklist
  checklist_items?: Record<string, any>

  // Damages
  damages_found?: boolean
  damage_description?: string
  estimated_repair_cost?: number

  // Photos
  photo_urls?: string[]

  // Signature
  signature_url?: string
  renter_signed?: boolean

  // Notes
  notes?: string

  created_at: string
}

export interface DamageReport {
  id: string
  report_number: string

  // Relationships
  booking_id?: string
  asset_id: string
  inspection_id?: string

  // Report Details
  title: string
  description: string
  severity?: string

  // Discovery
  discovered_by?: string
  discovery_date: string

  // Responsibility
  responsible_party?: string
  renter_id?: string

  // Cost
  estimated_repair_cost?: number
  actual_repair_cost?: number
  insurance_claim_amount?: number
  renter_charge_amount?: number

  // Resolution
  status?: string
  resolution_date?: string
  resolution_notes?: string

  // Evidence
  photo_urls?: string[]
  document_ids?: string[]

  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  contract_number: string

  // Relationships
  owner_id: string
  asset_id?: string

  // Contract Type
  contract_type: string

  // Terms
  start_date: string
  end_date?: string
  auto_renew?: boolean

  // Financial Terms
  terms: Record<string, any>

  // Status
  status?: string

  // Documents
  contract_pdf_url?: string

  // Signatures
  signed_by_owner?: boolean
  signed_by_manager?: boolean
  owner_signature_url?: string
  manager_signature_url?: string
  signed_date?: string

  created_at: string
  updated_at: string
}

export interface InsurancePolicy {
  id: string

  // Relationships
  asset_id: string
  owner_id?: string

  // Policy Details
  policy_number: string
  provider: string
  policy_type?: string

  // Coverage
  coverage_amount?: number
  deductible?: number

  // Dates
  effective_date: string
  expiry_date: string

  // Cost
  premium_amount?: number
  payment_frequency?: string

  // Documents
  policy_document_url?: string
  document_ids?: string[]

  // Status
  status?: string

  // Notes
  notes?: string

  created_at: string
  updated_at: string
}

export interface Communication {
  id: string

  // Participants
  from_user_id?: string
  to_user_id?: string

  // Related Entities
  booking_id?: string
  asset_id?: string

  // Message
  subject?: string
  message: string
  message_type?: string

  // Status
  is_read?: boolean
  read_at?: string

  // Attachments
  attachment_urls?: string[]

  created_at: string
}

export interface Review {
  id: string

  // Relationships
  booking_id: string
  asset_id?: string
  renter_id?: string
  owner_id?: string

  // Review
  reviewer_id?: string
  review_type: string

  // Ratings
  overall_rating: number
  cleanliness_rating?: number
  communication_rating?: number
  accuracy_rating?: number

  // Content
  title?: string
  review_text?: string

  // Response
  response_text?: string
  response_by?: string
  responded_at?: string

  // Status
  status?: string

  created_at: string
  updated_at: string
}

// Database type with all tables
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      owners: {
        Row: Owner
        Insert: Omit<Owner, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Owner, 'id' | 'created_at' | 'updated_at'>>
      }
      assets: {
        Row: Asset
        Insert: Omit<Asset, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Asset, 'id' | 'created_at' | 'updated_at'>>
      }
      renters: {
        Row: Renter
        Insert: Omit<Renter, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Renter, 'id' | 'created_at' | 'updated_at'>>
      }
      bookings: {
        Row: Booking
        Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Booking, 'id' | 'created_at' | 'updated_at'>>
      }
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'created_at'>
        Update: Partial<Omit<Transaction, 'id' | 'created_at'>>
      }
      expenses: {
        Row: Expense
        Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>
      }
      remittances: {
        Row: Remittance
        Insert: Omit<Remittance, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Remittance, 'id' | 'created_at' | 'updated_at'>>
      }
      documents: {
        Row: Document
        Insert: Omit<Document, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Document, 'id' | 'created_at' | 'updated_at'>>
      }
      maintenance_requests: {
        Row: MaintenanceRequest
        Insert: Omit<MaintenanceRequest, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MaintenanceRequest, 'id' | 'created_at' | 'updated_at'>>
      }
      inspections: {
        Row: Inspection
        Insert: Omit<Inspection, 'id' | 'created_at'>
        Update: Partial<Omit<Inspection, 'id' | 'created_at'>>
      }
      damage_reports: {
        Row: DamageReport
        Insert: Omit<DamageReport, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DamageReport, 'id' | 'created_at' | 'updated_at'>>
      }
      contracts: {
        Row: Contract
        Insert: Omit<Contract, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Contract, 'id' | 'created_at' | 'updated_at'>>
      }
      insurance_policies: {
        Row: InsurancePolicy
        Insert: Omit<InsurancePolicy, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<InsurancePolicy, 'id' | 'created_at' | 'updated_at'>>
      }
      communications: {
        Row: Communication
        Insert: Omit<Communication, 'id' | 'created_at'>
        Update: Partial<Omit<Communication, 'id' | 'created_at'>>
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Review, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
