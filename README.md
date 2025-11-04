# Consignments.ai - RV Fleet Management Platform

Enterprise-grade RV consignment management platform with automated owner payouts, document tracking, and HubSpot CRM integration.

**Demo URL**: http://localhost:3000

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

**Instant Demo Login**: Click any role button on login page
- Fleet Manager: `manager@demo.com` / `demo1234`
- Owner: `owner1@demo.com` / `demo1234`
- Renter: `renter@demo.com` / `demo1234`

---

## 📊 What's Built

### Fleet Manager (9 Pages)
- **Dashboard** - 25 RVs, 60 bookings, $45k+ revenue tracking
- **Fleet** - Browse/manage all RVs with filters
- **Bookings** - Complete booking lifecycle (inquiry → completed)
- **Expenses** - Approval workflow with auto-deduction
- **Remittances** - Calculate owner payouts, generate PDF statements
- **Documents** - Upload & manage receipts, contracts, reports
- **Financials** - Revenue charts, expense tracking, profit analysis
- **Maintenance** - Service request tracking with priorities
- **Owners** - Manage 10+ owners with portfolio stats

### Owner Portal
- Earnings dashboard with monthly trends
- RV performance metrics
- Payment history & statements
- Contract details (revenue split, fees, payout method)

### Renter Interface
- Browse 25 available RVs with search/filters
- My Bookings page (upcoming & past trips)
- RV detail pages with specs & amenities

### Special Features
- **Owner Onboarding** - 3-step form syncs to Supabase + HubSpot CRM
- **Check-in/Out** - Digital inspection with photo upload
- **PDF Generator** - Automated owner statements
- **HubSpot Integration** - Bidirectional sync (contacts, deals, tickets)

---

## 🛠️ Tech Stack

- **Next.js 14** (App Router, Server Components)
- **TypeScript** (100% type-safe)
- **Supabase** (PostgreSQL + Auth + Storage)
- **Shadcn/UI** (20+ components)
- **Tailwind CSS** (Black & white design)
- **jsPDF** (PDF generation)
- **HubSpot API** (CRM integration)

---

## 💾 Database

**16 Tables**: profiles, owners, assets, renters, bookings, transactions, expenses, remittances, documents, maintenance_requests, inspections, damage_reports, contracts, insurance_policies, communications, reviews

**Demo Data**: 25 RVs, 60 bookings, 10 owners, 62 expenses, 15 maintenance requests

---

## 🔧 Setup Required (15 minutes)

### 1. Configure Supabase
```
1. Run: supabase/schema-fixed.sql in SQL Editor
2. Run: supabase/fix-rls-policies.sql (enables data access)
3. Create storage buckets: documents, photos, avatars
4. Get API keys → Update .env.local
```

### 2. Seed Demo Data
```bash
npx tsx src/lib/seed/seed-data.ts
```

### 3. Configure HubSpot (Optional)
```
1. Create Private App in HubSpot
2. Enable scopes: contacts, deals, companies
3. Copy token → Update HUBSPOT_ACCESS_TOKEN in .env.local
```

See **SETUP.md** for detailed instructions.

---

## 📂 Project Structure

```
src/
├── app/
│   ├── (auth)/ - Login, signup, onboarding
│   ├── (manager)/ - 9 manager pages
│   ├── (owner)/ - Owner portal
│   ├── (renter)/ - Renter interface
│   └── api/ - 11 REST endpoints
├── lib/
│   ├── supabase/ - DB clients
│   ├── hubspot/ - CRM integration
│   └── seed/ - Demo data generator
├── components/ui/ - Shadcn components
└── types/ - TypeScript definitions
```

---

## 🎯 Key Features

✅ Role-based dashboards (Manager/Owner/Renter)
✅ Automated remittance calculations
✅ PDF statement generation
✅ Document upload to Supabase Storage
✅ Expense approval workflow
✅ HubSpot CRM bidirectional sync
✅ Check-in/out inspection flow
✅ Owner onboarding form
✅ Real-time booking tracking
✅ Financial analytics & charts

---

## 🔗 API Endpoints

- `/api/assets` - Fleet CRUD
- `/api/bookings` - Booking CRUD + transactions
- `/api/expenses` - Expense CRUD + approval
- `/api/documents/upload` - File uploads
- `/api/remittances/calculate` - Payout calculations
- `/api/remittances/generate-pdf` - PDF creation
- `/api/inspections` - Check-in/out records
- `/api/onboard/owner` - New owner applications
- `/api/sync/hubspot` - CRM synchronization
- `/api/webhooks/hubspot` - Receive CRM events

---

## 📱 Demo Credentials

```
Manager: manager@demo.com / demo1234
Owner:   owner1@demo.com / demo1234
Renter:  renter@demo.com / demo1234
```

---

## 🎨 Design

Black & white minimalist design inspired by Twitter/X:
- Black sidebar navigation
- White content areas
- Gray text hierarchy
- Clean button styles
- Professional aesthetics

---

Built for **Consignments.ai** - RV Management USA
Portfolio demo by [Your Name]
