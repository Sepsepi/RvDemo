# Setup Guide - 3 Steps to Working Demo

**Time Required**: 15 minutes

---

## Step 1: Configure Supabase Database (10 min)

### A. Create Database Schema

1. Go to https://supabase.com/dashboard/project/xaxzulvecgoyylicymid
2. Click **SQL Editor** (left sidebar)
3. Click **New query**
4. Open `supabase/schema-fixed.sql` in your editor
5. Copy **ALL contents** (Cmd/Ctrl + A, then Copy)
6. Paste into Supabase SQL Editor
7. Click **Run** (bottom right)
8. Wait for ✓ Success message

### B. Fix Row Level Security (RLS)

**CRITICAL**: Without this, dashboard shows 0 data!

1. Still in SQL Editor
2. Open `supabase/fix-rls-policies.sql`
3. Copy ALL contents
4. Paste into a new query
5. Click **Run**
6. Wait for ✓ Success

### C. Create Storage Buckets

1. Click **Storage** (left sidebar)
2. Click **New bucket**
3. Create 3 buckets:

**Bucket 1**: `documents`
- Public: **OFF** (private)
- Click Create

**Bucket 2**: `photos`
- Public: **ON**
- Click Create

**Bucket 3**: `avatars`
- Public: **ON**
- Click Create

### D. Get API Keys

1. Go to **Settings** → **API**
2. Copy these values:
   - Project URL
   - anon public key
   - service_role key (click "Reveal")
3. Already in `.env.local` - verify they match

---

## Step 2: Seed Demo Data (2 min)

```bash
# From project directory
npx tsx src/lib/seed/seed-data.ts
```

**Creates**:
- 4 users (manager, 2 owners, 1 renter)
- 10 owners with businesses
- 25 RVs (all classes)
- 60 bookings
- 15 maintenance requests
- 30 expenses

**You'll see**: "✅ Database seeded successfully!"

---

## Step 3: Configure HubSpot (3 min) - OPTIONAL

### Get Proper Token

1. Go to https://app.hubspot.com/settings
2. **Integrations** → **Private Apps**
3. Click **Create a private app**
4. Name: `Consignments.ai Demo`
5. **Scopes** tab → Enable:
   - ☑ crm.objects.contacts (Read & Write)
   - ☑ crm.objects.deals (Read & Write)
   - ☑ crm.objects.companies (Read & Write)
6. Click **Create app**
7. **Copy the access token** (starts with `pat-na1-...`)
8. Open `.env.local`
9. Update line 7:
   ```
   HUBSPOT_ACCESS_TOKEN=pat-na1-YOUR-TOKEN-HERE
   ```
10. Save file
11. Restart server (Ctrl+C, then `npm run dev`)

**Note**: Token format should be `pat-na1-...` NOT `na3-...`

---

## ✅ Verify Setup

### Check 1: Server Running
```bash
npm run dev
# Should show: ✓ Ready in XXXms
# Open: http://localhost:3000
```

### Check 2: Login Works
```
1. Go to http://localhost:3000
2. Click "Continue as Fleet Manager"
3. Should redirect to /manager/dashboard
```

### Check 3: Data Shows
**Dashboard should display**:
- Total Fleet: 25 (not 0!)
- Active Bookings: 15+ (not 0!)
- Total Revenue: $40,000+ (not $0!)
- Maintenance: 15 (not 0!)

**If you see 0s**: Go back to Step 1B - RLS fix not applied

### Check 4: Test Features
```
✅ Click Fleet → See 25 RVs
✅ Click Bookings → See 60 bookings
✅ Click Expenses → See 62 expenses, try "Approve"
✅ Click Remittances → Select owner, calculate payout
✅ Sign out → Login as Owner → See earnings
✅ Sign out → Login as Renter → Browse RVs
```

---

## 🐛 Troubleshooting

### Problem: "No RVs found" / All stats show 0

**Solution**: RLS policies not applied
```
1. Run: supabase/fix-rls-policies.sql
2. Refresh page
3. Hard refresh: Cmd/Ctrl + Shift + R
```

### Problem: "Owner profile not found"

**Solution**: Re-run seed script
```bash
npx tsx src/lib/seed/seed-data.ts
```

### Problem: Document upload fails

**Solution**: Storage buckets not created
```
Supabase → Storage → Create buckets: documents, photos, avatars
```

### Problem: HubSpot integration errors

**Solution**: Token format wrong
```
Should be: pat-na1-... (NOT na3-...)
Get new token from HubSpot Private Apps
```

---

## 🎯 What You Get After Setup

**Working Demo With**:
- 25 RVs across all classes
- 60 bookings (completed, active, upcoming)
- 10 owners with different contract terms
- 62 expenses (11 pending, 51 approved)
- 15 maintenance requests
- $45,000+ in tracked revenue
- Functional expense approval
- Working remittance calculator
- PDF statement generation
- HubSpot sync (after token fix)

---

## 🚀 Ready to Demo!

**URL**: http://localhost:3000

**Show**:
1. One-click role logins
2. Manager dashboard with real data
3. Approve an expense live
4. Calculate owner payout
5. Browse 25 RVs as renter
6. Owner earnings breakdown

**Total Setup Time**: 15 minutes
**Demo Time**: 5-10 minutes
**Impress Factor**: ⭐⭐⭐⭐⭐

---

**Need help?** All APIs and features documented in code comments.
