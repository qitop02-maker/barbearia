import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { getSupabase } from './src/lib/supabase';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  /**
   * 1) Criar vaga disponível (Barbearia)
   * POST /api/slots/create
   */
  app.post('/api/slots/create', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();
      const { barbershop_id, start_time, end_time, original_price, discounted_price, service_name } = req.body;

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
   * 2) Listar vagas abertas (Cliente)
   * GET /api/slots
   */
  app.get('/api/slots', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();
      const { city, service, min_discount } = req.query;

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
  app.post('/api/reservations/create', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();
      const { slot_id, client_id } = req.body;

      // 1. Check if slot is still available
      const { data: slot, error: slotError } = await supabase
        .from('slots')
        .select('status')
        .eq('id', slot_id)
        .single();

      if (slotError || !slot) return res.status(404).json({ error: 'Vaga não encontrada' });
      if (slot.status !== 'available') return res.status(400).json({ error: 'Vaga já reservada ou indisponível' });

      // 2. Create booking and update slot status
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{ slot_id, client_id, status: 'pending' }])
        .select()
        .single();

      if (bookingError) return res.status(400).json({ error: bookingError.message });

      await supabase
        .from('slots')
        .update({ status: 'booked' })
        .eq('id', slot_id);

      return res.status(201).json(booking);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * 4) Cancelar reserva
   * POST /api/reservations/cancel
   */
  app.post('/api/reservations/cancel', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();
      const { booking_id } = req.body;

      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('slot_id')
        .eq('id', booking_id)
        .single();

      if (fetchError || !booking) return res.status(404).json({ error: 'Reserva não encontrada' });

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking_id);

      if (updateError) return res.status(400).json({ error: updateError.message });

      // Make slot available again
      await supabase
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
  app.post('/api/reservations/checkin', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();
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
  app.post('/api/reservations/complete', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();
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
      await supabase
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
