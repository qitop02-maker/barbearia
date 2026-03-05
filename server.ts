import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { getSupabase } from './src/lib/supabase';
import dotenv from 'dotenv';

dotenv.config();

// Middleware to verify Supabase JWT
const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Attach user and token to request
    (req as any).user = user;
    (req as any).token = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Auth failed' });
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  /**
   * 1) Criar vaga disponível (Barbearia)
   * POST /api/slots/create
   */
  app.post('/api/slots/create', verifyAuth, async (req: Request, res: Response) => {
    try {
      const token = (req as any).token;
      const supabase = getSupabase(token);
      const { barbershop_id, start_time, end_time, original_price, discounted_price } = req.body;

      // RLS will ensure the user owns the barbershop
      const { data, error } = await supabase
        .from('slots')
        .insert([
          { 
            barbershop_id, 
            start_time, 
            end_time, 
            original_price, 
            discounted_price,
            status: 'available'
          }
        ])
        .select();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json(data[0]);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * 2) Listar vagas abertas (Cliente) - Public
   * GET /api/slots
   */
  app.get('/api/slots', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();
      const { city, min_discount } = req.query;

      let query = supabase
        .from('slots')
        .select(`
          *,
          barbershops!inner (
            name,
            address,
            city,
            logo_url
          )
        `)
        .eq('status', 'available');

      if (city) {
        query = query.eq('barbershops.city', city);
      }
      
      const { data, error } = await query;

      if (error) return res.status(400).json({ error: error.message });
      
      let filteredData = data;
      if (min_discount) {
        const minDisc = parseFloat(min_discount as string);
        filteredData = data.filter(slot => {
          const discount = ((slot.original_price - slot.discounted_price) / slot.original_price) * 100;
          return discount >= minDisc;
        });
      }

      return res.json(filteredData);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * 3) Reservar vaga (Cliente)
   * POST /api/reservations/create
   */
  app.post('/api/reservations/create', verifyAuth, async (req: Request, res: Response) => {
    try {
      const token = (req as any).token;
      const supabase = getSupabase(token);
      const { slot_id } = req.body;

      // Use the atomic RPC function to prevent race conditions
      // Now it uses auth.uid() internally, so we don't pass p_client_id
      const { data: bookingId, error } = await supabase.rpc('book_slot', {
        p_slot_id: slot_id
      });

      if (error) return res.status(400).json({ error: error.message });

      return res.status(201).json({ id: bookingId });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * 4) Cancelar reserva
   * POST /api/reservations/cancel
   */
  app.post('/api/reservations/cancel', verifyAuth, async (req: Request, res: Response) => {
    try {
      const token = (req as any).token;
      const supabase = getSupabase(token);
      const { booking_id } = req.body;

      // 1. Get the booking to find the slot_id
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('slot_id')
        .eq('id', booking_id)
        .single();

      if (fetchError || !booking) return res.status(404).json({ error: 'Reserva não encontrada ou sem permissão' });

      // 2. Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking_id);

      if (updateError) return res.status(400).json({ error: updateError.message });

      // 3. Make slot available again
      // We use service role here because RLS might prevent a client from updating a slot directly
      const adminSupabase = getSupabase();
      await adminSupabase
        .from('slots')
        .update({ status: 'available' })
        .eq('id', booking.slot_id);

      return res.json({ message: 'Reserva cancelada com sucesso' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * 5) Check-in do cliente (Barbearia)
   * POST /api/reservations/checkin
   */
  app.post('/api/reservations/checkin', verifyAuth, async (req: Request, res: Response) => {
    try {
      const token = (req as any).token;
      const supabase = getSupabase(token);
      const { booking_id } = req.body;

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking_id);

      if (error) return res.status(400).json({ error: error.message });
      return res.json({ message: 'Check-in realizado' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * 6) Finalizar atendimento / Marcar No-show
   * POST /api/reservations/complete
   */
  app.post('/api/reservations/complete', verifyAuth, async (req: Request, res: Response) => {
    try {
      const token = (req as any).token;
      const supabase = getSupabase(token);
      const { booking_id, is_no_show } = req.body;

      const status = is_no_show ? 'cancelled' : 'completed';
      
      // 1. Update booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .update({ status: status })
        .eq('id', booking_id)
        .select('slot_id')
        .single();

      if (bookingError) return res.status(400).json({ error: bookingError.message });

      // 2. Update slot
      // Use service role to update slot status to completed
      const adminSupabase = getSupabase();
      await adminSupabase
        .from('slots')
        .update({ status: 'completed' })
        .eq('id', booking.slot_id);

      return res.json({ message: is_no_show ? 'No-show registrado' : 'Atendimento finalizado' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
