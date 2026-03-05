-- BarberNow Database Schema
-- Optimized for Supabase (PostgreSQL)

-- 1. Create Custom Types
CREATE TYPE user_role AS ENUM ('client', 'barbershop', 'admin');
CREATE TYPE slot_status AS ENUM ('available', 'booked', 'cancelled', 'completed');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- 2. Profiles Table (Extends Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role user_role DEFAULT 'client' NOT NULL,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Barbershops Table
CREATE TABLE barbershops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT,
  description TEXT,
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Slots Table (The "Last Minute" opportunities)
CREATE TABLE slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  discounted_price DECIMAL(10,2) NOT NULL,
  status slot_status DEFAULT 'available' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bookings Table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID REFERENCES slots(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status booking_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(slot_id) -- A slot can only have one active booking
);

-- 6. Indexes for Performance
CREATE INDEX idx_slots_barbershop ON slots(barbershop_id);
CREATE INDEX idx_slots_status ON slots(status);
CREATE INDEX idx_slots_start_time ON slots(start_time);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_barbershops_owner ON barbershops(owner_id);
CREATE INDEX idx_barbershops_city ON barbershops(city);

-- 7. Row Level Security (RLS)

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Barbershops Policies
CREATE POLICY "Barbershops are viewable by everyone" ON barbershops
  FOR SELECT USING (true);

CREATE POLICY "Owners can manage their barbershops" ON barbershops
  FOR ALL USING (auth.uid() = owner_id);

-- Slots Policies
CREATE POLICY "Available slots are viewable by everyone" ON slots
  FOR SELECT USING (status = 'available' OR auth.uid() IN (
    SELECT owner_id FROM barbershops WHERE id = slots.barbershop_id
  ));

CREATE POLICY "Barbershops can manage their slots" ON slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM barbershops 
      WHERE id = slots.barbershop_id AND owner_id = auth.uid()
    )
  );

-- Bookings Policies
CREATE POLICY "Clients can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Barbershops can view bookings for their slots" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM slots
      JOIN barbershops ON slots.barbershop_id = barbershops.id
      WHERE slots.id = bookings.slot_id AND barbershops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own bookings" ON bookings
  FOR UPDATE USING (
    auth.uid() = client_id OR 
    EXISTS (
      SELECT 1 FROM slots
      JOIN barbershops ON slots.barbershop_id = barbershops.id
      WHERE slots.id = bookings.slot_id AND barbershops.owner_id = auth.uid()
    )
  );

-- 8. Trigger for Profile Creation on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'client');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
