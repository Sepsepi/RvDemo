-- Consignments.ai Database Schema
-- Comprehensive RV Rental Consignment Platform
-- FIXED VERSION: Removed circular dependencies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE user_role AS ENUM ('manager', 'owner', 'renter', 'admin');

-- Asset status enum
CREATE TYPE asset_status AS ENUM ('available', 'in_use', 'maintenance', 'inactive', 'pending_approval');

-- Booking status enum
CREATE TYPE booking_status AS ENUM ('inquiry', 'confirmed', 'checked_in', 'active', 'checked_out', 'completed', 'cancelled');

-- Maintenance status enum
CREATE TYPE maintenance_status AS ENUM ('requested', 'scheduled', 'in_progress', 'completed', 'cancelled');

-- Document types enum
CREATE TYPE document_type AS ENUM (
  'rental_receipt',
  'maintenance_receipt',
  'cleaning_invoice',
  'insurance_policy',
  'vehicle_registration',
  'consignment_contract',
  'rental_agreement',
  'inspection_report',
  'damage_report',
  'owner_statement',
  'payment_receipt',
  'other'
);

-- Transaction types enum
CREATE TYPE transaction_type AS ENUM ('rental_income', 'maintenance', 'cleaning', 'insurance', 'platform_fee', 'damage', 'refund', 'remittance');

-- Expense categories enum
CREATE TYPE expense_category AS ENUM ('maintenance', 'repair', 'cleaning', 'insurance', 'registration', 'storage', 'fuel', 'other');

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'renter',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- OWNERS
-- ============================================

CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  tax_id TEXT,
  bank_account_info JSONB,
  preferred_payout_method TEXT DEFAULT 'ach',

  -- Contract terms
  revenue_split_percentage DECIMAL(5,2) DEFAULT 70.00,
  platform_fee_percentage DECIMAL(5,2) DEFAULT 10.00,
  contract_type TEXT DEFAULT 'standard',
  contract_terms JSONB,
  expense_cap_monthly DECIMAL(10,2),
  minimum_guarantee_monthly DECIMAL(10,2),

  -- Status
  status TEXT DEFAULT 'active',
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ASSETS (RVs)
-- ============================================

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  status asset_status DEFAULT 'pending_approval',

  -- Vehicle Details
  year INTEGER,
  make TEXT,
  model TEXT,
  vin TEXT UNIQUE,
  license_plate TEXT,
  rv_type TEXT,
  length_feet DECIMAL(5,2),
  weight_lbs INTEGER,

  -- Specifications
  sleeps INTEGER,
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  fuel_type TEXT,
  mileage INTEGER,
  transmission TEXT,

  -- Features
  features JSONB,
  amenities TEXT[],

  -- Location
  storage_location TEXT,
  storage_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  -- Pricing
  base_price_per_night DECIMAL(10,2) NOT NULL,
  cleaning_fee DECIMAL(10,2) DEFAULT 75.00,
  security_deposit DECIMAL(10,2) DEFAULT 500.00,
  minimum_rental_nights INTEGER DEFAULT 2,

  -- Insurance
  insurance_policy_number TEXT,
  insurance_expiry_date DATE,

  -- Registration
  registration_number TEXT,
  registration_expiry_date DATE,

  -- Images
  primary_image_url TEXT,
  image_urls TEXT[],

  -- Tracking
  total_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  average_rating DECIMAL(3,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- RENTERS
-- ============================================

CREATE TABLE renters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Personal Info
  drivers_license_number TEXT,
  drivers_license_state TEXT,
  drivers_license_expiry DATE,
  date_of_birth DATE,

  -- Contact
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,

  -- Stats
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  average_rating DECIMAL(3,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BOOKINGS
-- ============================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number TEXT UNIQUE NOT NULL,

  -- Relationships
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  renter_id UUID REFERENCES renters(id),
  owner_id UUID REFERENCES owners(id),

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_nights INTEGER NOT NULL,

  -- Pricing
  nightly_rate DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  cleaning_fee DECIMAL(10,2) DEFAULT 0,
  security_deposit DECIMAL(10,2) DEFAULT 0,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,

  -- Status
  status booking_status DEFAULT 'inquiry',

  -- Check-in/out
  actual_checkin_time TIMESTAMP WITH TIME ZONE,
  actual_checkout_time TIMESTAMP WITH TIME ZONE,
  checkin_mileage INTEGER,
  checkout_mileage INTEGER,

  -- Notes
  special_requests TEXT,
  internal_notes TEXT,

  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DOCUMENTS (Create this BEFORE transactions)
-- ============================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES owners(id),
  booking_id UUID REFERENCES bookings(id),
  renter_id UUID REFERENCES renters(id),

  -- Document Details
  document_type document_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,

  -- Metadata
  document_date DATE,
  uploaded_by UUID REFERENCES profiles(id),

  -- Organization
  tags TEXT[],
  category TEXT,

  -- Status
  status TEXT DEFAULT 'active',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MAINTENANCE REQUESTS (Create before expenses)
-- ============================================

CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT UNIQUE NOT NULL,

  -- Relationships
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES owners(id),
  reported_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),

  -- Request Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  category TEXT,

  -- Status
  status maintenance_status DEFAULT 'requested',

  -- Scheduling
  scheduled_date DATE,
  completion_date DATE,

  -- Cost
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),

  -- Vendor
  vendor_name TEXT,
  vendor_contact TEXT,

  -- Resolution
  resolution_notes TEXT,

  -- Images
  before_images TEXT[],
  after_images TEXT[],

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EXPENSES
-- ============================================

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES owners(id),
  maintenance_request_id UUID REFERENCES maintenance_requests(id),

  -- Expense Details
  category expense_category NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  vendor TEXT,

  -- Approval
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,

  -- Payment
  paid_to TEXT,
  payment_method TEXT,
  payment_date DATE,

  -- Deduction
  deduct_from_owner BOOLEAN DEFAULT TRUE,
  deducted_amount DECIMAL(10,2),
  owner_responsible_percentage DECIMAL(5,2) DEFAULT 100.00,

  -- Documents
  receipt_url TEXT,
  document_ids UUID[],

  -- Dates
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS (Financial Ledger)
-- ============================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  booking_id UUID REFERENCES bookings(id),
  asset_id UUID REFERENCES assets(id),
  owner_id UUID REFERENCES owners(id),
  renter_id UUID REFERENCES renters(id),

  -- Transaction Details
  transaction_type transaction_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,

  -- Categorization
  category TEXT,
  subcategory TEXT,

  -- Reference
  reference_number TEXT,
  payment_method TEXT,

  -- Status
  status TEXT DEFAULT 'completed',

  -- Documents (NOW documents table exists)
  receipt_url TEXT,
  document_id UUID REFERENCES documents(id),

  -- Dates
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- REMITTANCES (Owner Payouts)
-- ============================================

CREATE TABLE remittances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  remittance_number TEXT UNIQUE NOT NULL,

  -- Relationships
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Calculations
  gross_rental_income DECIMAL(12,2) DEFAULT 0,
  platform_fees DECIMAL(12,2) DEFAULT 0,
  cleaning_fees DECIMAL(12,2) DEFAULT 0,
  maintenance_expenses DECIMAL(12,2) DEFAULT 0,
  other_expenses DECIMAL(12,2) DEFAULT 0,
  total_deductions DECIMAL(12,2) DEFAULT 0,
  net_income DECIMAL(12,2) DEFAULT 0,
  owner_split_percentage DECIMAL(5,2) NOT NULL,
  owner_payout_amount DECIMAL(12,2) NOT NULL,

  -- Itemization
  booking_ids UUID[],
  expense_ids UUID[],
  transaction_ids UUID[],

  -- Payment
  status TEXT DEFAULT 'draft',
  payment_method TEXT,
  payment_date DATE,
  payment_reference TEXT,

  -- Documents
  statement_pdf_url TEXT,
  generated_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,

  -- Notes
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INSPECTIONS (Check-in/Check-out)
-- ============================================

CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id),

  -- Type
  inspection_type TEXT NOT NULL,

  -- Inspector
  inspector_id UUID REFERENCES profiles(id),
  inspection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Mileage
  mileage INTEGER,
  fuel_level TEXT,

  -- Condition Checklist
  exterior_condition TEXT DEFAULT 'good',
  interior_condition TEXT DEFAULT 'good',
  mechanical_condition TEXT DEFAULT 'good',

  -- Detailed Checklist (JSON)
  checklist_items JSONB,

  -- Damages
  damages_found BOOLEAN DEFAULT FALSE,
  damage_description TEXT,
  estimated_repair_cost DECIMAL(10,2),

  -- Photos
  photo_urls TEXT[],

  -- Signature
  signature_url TEXT,
  renter_signed BOOLEAN DEFAULT FALSE,

  -- Notes
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DAMAGE REPORTS
-- ============================================

CREATE TABLE damage_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number TEXT UNIQUE NOT NULL,

  -- Relationships
  booking_id UUID REFERENCES bookings(id),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  inspection_id UUID REFERENCES inspections(id),

  -- Report Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'minor',

  -- Discovery
  discovered_by UUID REFERENCES profiles(id),
  discovery_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Responsibility
  responsible_party TEXT,
  renter_id UUID REFERENCES renters(id),

  -- Cost
  estimated_repair_cost DECIMAL(10,2),
  actual_repair_cost DECIMAL(10,2),
  insurance_claim_amount DECIMAL(10,2),
  renter_charge_amount DECIMAL(10,2),

  -- Resolution
  status TEXT DEFAULT 'reported',
  resolution_date DATE,
  resolution_notes TEXT,

  -- Evidence
  photo_urls TEXT[],
  document_ids UUID[],

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CONTRACTS
-- ============================================

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_number TEXT UNIQUE NOT NULL,

  -- Relationships
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id),

  -- Contract Type
  contract_type TEXT NOT NULL,

  -- Terms
  start_date DATE NOT NULL,
  end_date DATE,
  auto_renew BOOLEAN DEFAULT FALSE,

  -- Financial Terms (JSONB for flexibility)
  terms JSONB NOT NULL,

  -- Status
  status TEXT DEFAULT 'draft',

  -- Documents
  contract_pdf_url TEXT,

  -- Signatures
  signed_by_owner BOOLEAN DEFAULT FALSE,
  signed_by_manager BOOLEAN DEFAULT FALSE,
  owner_signature_url TEXT,
  manager_signature_url TEXT,
  signed_date DATE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INSURANCE POLICIES
-- ============================================

CREATE TABLE insurance_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES owners(id),

  -- Policy Details
  policy_number TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  policy_type TEXT,

  -- Coverage
  coverage_amount DECIMAL(12,2),
  deductible DECIMAL(10,2),

  -- Dates
  effective_date DATE NOT NULL,
  expiry_date DATE NOT NULL,

  -- Cost
  premium_amount DECIMAL(10,2),
  payment_frequency TEXT,

  -- Documents
  policy_document_url TEXT,
  document_ids UUID[],

  -- Status
  status TEXT DEFAULT 'active',

  -- Notes
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMMUNICATIONS
-- ============================================

CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Participants
  from_user_id UUID REFERENCES profiles(id),
  to_user_id UUID REFERENCES profiles(id),

  -- Related Entities
  booking_id UUID REFERENCES bookings(id),
  asset_id UUID REFERENCES assets(id),

  -- Message
  subject TEXT,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'general',

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Attachments
  attachment_urls TEXT[],

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- REVIEWS & RATINGS
-- ============================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id),
  renter_id UUID REFERENCES renters(id),
  owner_id UUID REFERENCES owners(id),

  -- Review
  reviewer_id UUID REFERENCES profiles(id),
  review_type TEXT NOT NULL,

  -- Ratings (1-5)
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),

  -- Content
  title TEXT,
  review_text TEXT,

  -- Response
  response_text TEXT,
  response_by UUID REFERENCES profiles(id),
  responded_at TIMESTAMP WITH TIME ZONE,

  -- Status
  status TEXT DEFAULT 'published',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

CREATE INDEX idx_assets_owner_id ON assets(owner_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_rv_type ON assets(rv_type);
CREATE INDEX idx_assets_city_state ON assets(city, state);

CREATE INDEX idx_bookings_asset_id ON bookings(asset_id);
CREATE INDEX idx_bookings_renter_id ON bookings(renter_id);
CREATE INDEX idx_bookings_owner_id ON bookings(owner_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);

CREATE INDEX idx_transactions_booking_id ON transactions(booking_id);
CREATE INDEX idx_transactions_asset_id ON transactions(asset_id);
CREATE INDEX idx_transactions_owner_id ON transactions(owner_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);

CREATE INDEX idx_expenses_asset_id ON expenses(asset_id);
CREATE INDEX idx_expenses_owner_id ON expenses(owner_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

CREATE INDEX idx_remittances_owner_id ON remittances(owner_id);
CREATE INDEX idx_remittances_period ON remittances(period_start, period_end);
CREATE INDEX idx_remittances_status ON remittances(status);

CREATE INDEX idx_documents_asset_id ON documents(asset_id);
CREATE INDEX idx_documents_owner_id ON documents(owner_id);
CREATE INDEX idx_documents_type ON documents(document_type);

CREATE INDEX idx_maintenance_asset_id ON maintenance_requests(asset_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);

-- ============================================
-- TRIGGERS for Updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_owners_updated_at BEFORE UPDATE ON owners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_renters_updated_at BEFORE UPDATE ON renters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_remittances_updated_at BEFORE UPDATE ON remittances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON maintenance_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_damage_reports_updated_at BEFORE UPDATE ON damage_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_updated_at BEFORE UPDATE ON insurance_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE renters ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE remittances ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you can customize these)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- FUNCTIONS for Business Logic
-- ============================================

-- Function to calculate remittance for an owner
CREATE OR REPLACE FUNCTION calculate_owner_remittance(
  p_owner_id UUID,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS TABLE (
  gross_income DECIMAL,
  total_deductions DECIMAL,
  net_income DECIMAL,
  owner_payout DECIMAL
) AS $$
DECLARE
  v_gross_income DECIMAL := 0;
  v_platform_fees DECIMAL := 0;
  v_expenses DECIMAL := 0;
  v_owner_split DECIMAL;
BEGIN
  SELECT COALESCE(SUM(total_amount), 0) INTO v_gross_income
  FROM bookings
  WHERE owner_id = p_owner_id
    AND status = 'completed'
    AND end_date BETWEEN p_period_start AND p_period_end;

  v_platform_fees := v_gross_income * 0.10;

  SELECT COALESCE(SUM(amount), 0) INTO v_expenses
  FROM expenses
  WHERE owner_id = p_owner_id
    AND status = 'approved'
    AND expense_date BETWEEN p_period_start AND p_period_end;

  SELECT revenue_split_percentage INTO v_owner_split
  FROM owners
  WHERE id = p_owner_id;

  RETURN QUERY
  SELECT
    v_gross_income,
    (v_platform_fees + v_expenses),
    (v_gross_income - v_platform_fees - v_expenses),
    ((v_gross_income - v_platform_fees - v_expenses) * v_owner_split / 100);
END;
$$ LANGUAGE plpgsql;

-- Function to generate booking number
CREATE SEQUENCE booking_sequence START 1;

CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('booking_sequence')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL OR NEW.booking_number = '' THEN
    NEW.booking_number := generate_booking_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_booking_number_trigger
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION set_booking_number();

-- ============================================
-- VIEWS for Common Queries
-- ============================================

CREATE OR REPLACE VIEW fleet_dashboard_summary AS
SELECT
  COUNT(*) as total_assets,
  COUNT(*) FILTER (WHERE status = 'available') as available_assets,
  COUNT(*) FILTER (WHERE status = 'in_use') as in_use_assets,
  COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance_assets,
  COALESCE(SUM(total_revenue), 0) as total_revenue,
  AVG(average_rating) as avg_rating
FROM assets;

CREATE OR REPLACE VIEW owner_earnings_summary AS
SELECT
  o.id as owner_id,
  o.business_name,
  COUNT(DISTINCT a.id) as total_assets,
  COUNT(DISTINCT b.id) as total_bookings,
  COALESCE(SUM(b.total_amount), 0) as gross_revenue,
  COALESCE(SUM(e.amount), 0) as total_expenses,
  COALESCE(SUM(r.owner_payout_amount), 0) as total_payouts
FROM owners o
LEFT JOIN assets a ON a.owner_id = o.id
LEFT JOIN bookings b ON b.owner_id = o.id AND b.status = 'completed'
LEFT JOIN expenses e ON e.owner_id = o.id AND e.status = 'approved'
LEFT JOIN remittances r ON r.owner_id = o.id AND r.status = 'paid'
GROUP BY o.id, o.business_name;

CREATE OR REPLACE VIEW upcoming_maintenance AS
SELECT
  mr.*,
  a.name as asset_name,
  a.vin,
  o.business_name as owner_name
FROM maintenance_requests mr
JOIN assets a ON a.id = mr.asset_id
JOIN owners o ON o.id = mr.owner_id
WHERE mr.status IN ('requested', 'scheduled', 'in_progress')
ORDER BY mr.priority DESC, mr.scheduled_date ASC;
