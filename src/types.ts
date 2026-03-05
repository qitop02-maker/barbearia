export type UserRole = 'client' | 'barbershop' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
}

export interface Barbershop {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  description?: string;
  logo_url?: string;
  is_verified: boolean;
}

export type SlotStatus = 'available' | 'booked' | 'cancelled' | 'completed';

export interface Slot {
  id: string;
  barbershop_id: string;
  service_name: string;
  start_time: string;
  end_time: string;
  original_price: number;
  discounted_price: number;
  status: SlotStatus;
  barbershops?: Barbershop; // Joined data
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  slot_id: string;
  client_id: string;
  status: BookingStatus;
  created_at: string;
  slots?: Slot & { barbershops: Barbershop }; // Joined data
}
