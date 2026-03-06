import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { getSupabase, getAdminSupabase } from './src/lib/supabase';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to verify Supabase JWT
const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase configuration missing on server' });
    }
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
      const user = (req as any).user;
      const supabase = getSupabase(token);
      const { barbershop_id, service_name, start_time, end_time, original_price, discounted_price } = req.body;

      console.log(`[API] Attempting to create slot for shop ${barbershop_id} by user ${user.id}`);

      // RLS will ensure the user owns the barbershop
      const { data, error } = await supabase
        .from('slots')
        .insert([
          { 
            barbershop_id, 
            service_name,
            start_time, 
            end_time, 
            original_price, 
            discounted_price,
            status: 'available'
          }
        ])
        .select();

      if (error) {
        console.error('[API] Supabase error creating slot:', error);
        return res.status(400).json({ error: error.message });
      }

      if (!data || data.length === 0) {
        console.error('[API] No data returned after slot insertion');
        return res.status(500).json({ error: 'Falha ao criar vaga: nenhum dado retornado.' });
      }

      console.log(`[API] Slot created successfully: ${data[0].id}`);
      return res.status(201).json(data[0]);
    } catch (err: any) {
      console.error('[API] Unexpected error in /api/slots/create:', err);
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
      const adminSupabase = getAdminSupabase();
      if (adminSupabase) {
        await adminSupabase
          .from('slots')
          .update({ status: 'available' })
          .eq('id', booking.slot_id);
      }

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
   * 7) Listar reservas do cliente
   * GET /api/reservations/client
   */
  app.get('/api/reservations/client', verifyAuth, async (req: Request, res: Response) => {
    try {
      const token = (req as any).token;
      const user = (req as any).user;
      const supabase = getSupabase(token);

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          slots (
            *,
            barbershops (
              name,
              address,
              city,
              logo_url
            )
          )
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) return res.status(400).json({ error: error.message });
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * 8) Listar reservas da barbearia
   * GET /api/reservations/shop
   */
  app.get('/api/reservations/shop', verifyAuth, async (req: Request, res: Response) => {
    try {
      const token = (req as any).token;
      const user = (req as any).user;
      const supabase = getSupabase(token);

      // 1. Get the barbershop owned by the user
      const { data: shop, error: shopError } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (shopError || !shop) return res.status(404).json({ error: 'Barbearia não encontrada' });

      // 2. Get bookings for slots of this barbershop
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          slots!inner (
            *
          ),
          profiles:client_id (
            full_name,
            avatar_url
          )
        `)
        .eq('slots.barbershop_id', shop.id)
        .order('created_at', { ascending: false });

      if (error) return res.status(400).json({ error: error.message });
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * 9) Listar vagas da barbearia
   * GET /api/slots/shop
   */
  app.get('/api/slots/shop', verifyAuth, async (req: Request, res: Response) => {
    try {
      const token = (req as any).token;
      const user = (req as any).user;
      const supabase = getSupabase(token);

      // 1. Get the barbershop owned by the user
      const { data: shop, error: shopError } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (shopError || !shop) return res.status(404).json({ error: 'Barbearia não encontrada' });

      const { data, error } = await supabase
        .from('slots')
        .select('*')
        .eq('barbershop_id', shop.id)
        .order('start_time', { ascending: true });

      if (error) return res.status(400).json({ error: error.message });
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * 10) Finalizar atendimento / Marcar No-show
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
      const adminSupabase = getAdminSupabase();
      if (adminSupabase) {
        await adminSupabase
          .from('slots')
          .update({ status: 'completed' })
          .eq('id', booking.slot_id);
      }

      return res.json({ message: is_no_show ? 'No-show registrado' : 'Atendimento finalizado' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // --- VITE MIDDLEWARE / STATIC FILES ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    
    // SPA Fallback for development
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
