-- FIX RLS POLICIES - Allow manager to see all data

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create permissive policies for demo (tighten for production)

-- Profiles: Everyone can read, update own
CREATE POLICY "Allow read access" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow update own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Owners: Everyone can read
CREATE POLICY "Allow read owners" ON owners FOR SELECT USING (true);
CREATE POLICY "Allow insert owners" ON owners FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update owners" ON owners FOR UPDATE USING (true);

-- Assets: Everyone can read
CREATE POLICY "Allow read assets" ON assets FOR SELECT USING (true);
CREATE POLICY "Allow insert assets" ON assets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update assets" ON assets FOR UPDATE USING (true);
CREATE POLICY "Allow delete assets" ON assets FOR DELETE USING (true);

-- Renters: Everyone can read
CREATE POLICY "Allow read renters" ON renters FOR SELECT USING (true);
CREATE POLICY "Allow insert renters" ON renters FOR INSERT WITH CHECK (true);

-- Bookings: Everyone can read
CREATE POLICY "Allow read bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Allow insert bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update bookings" ON bookings FOR UPDATE USING (true);

-- Transactions: Everyone can read
CREATE POLICY "Allow read transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow insert transactions" ON transactions FOR INSERT WITH CHECK (true);

-- Expenses: Everyone can read
CREATE POLICY "Allow read expenses" ON expenses FOR SELECT USING (true);
CREATE POLICY "Allow insert expenses" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update expenses" ON expenses FOR UPDATE USING (true);

-- Remittances: Everyone can read
CREATE POLICY "Allow read remittances" ON remittances FOR SELECT USING (true);
CREATE POLICY "Allow insert remittances" ON remittances FOR INSERT WITH CHECK (true);

-- Documents: Everyone can read
CREATE POLICY "Allow read documents" ON documents FOR SELECT USING (true);
CREATE POLICY "Allow insert documents" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete documents" ON documents FOR DELETE USING (true);

-- Maintenance: Everyone can read
CREATE POLICY "Allow read maintenance" ON maintenance_requests FOR SELECT USING (true);
CREATE POLICY "Allow insert maintenance" ON maintenance_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update maintenance" ON maintenance_requests FOR UPDATE USING (true);

-- Inspections: Everyone can read
CREATE POLICY "Allow read inspections" ON inspections FOR SELECT USING (true);
CREATE POLICY "Allow insert inspections" ON inspections FOR INSERT WITH CHECK (true);

-- Damage Reports: Everyone can read
CREATE POLICY "Allow read damage_reports" ON damage_reports FOR SELECT USING (true);
CREATE POLICY "Allow insert damage_reports" ON damage_reports FOR INSERT WITH CHECK (true);

-- Contracts: Everyone can read
CREATE POLICY "Allow read contracts" ON contracts FOR SELECT USING (true);
CREATE POLICY "Allow insert contracts" ON contracts FOR INSERT WITH CHECK (true);

-- Insurance: Everyone can read
CREATE POLICY "Allow read insurance" ON insurance_policies FOR SELECT USING (true);
CREATE POLICY "Allow insert insurance" ON insurance_policies FOR INSERT WITH CHECK (true);

-- Communications: Everyone can read
CREATE POLICY "Allow read communications" ON communications FOR SELECT USING (true);
CREATE POLICY "Allow insert communications" ON communications FOR INSERT WITH CHECK (true);

-- Reviews: Everyone can read
CREATE POLICY "Allow read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Allow insert reviews" ON reviews FOR INSERT WITH CHECK (true);
