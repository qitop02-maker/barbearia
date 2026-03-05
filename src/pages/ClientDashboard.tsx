import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, XCircle, CheckCircle2, Scissors, History, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Booking } from '../types';

export const ClientDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock fetching client bookings
    const fetchBookings = async () => {
      try {
        // In a real app, this would be a specific endpoint for the user
        const response = await fetch('/api/slots'); // Mocking with slots for now
        const data = await response.json();
        // Transform slots to mock bookings
        const mockBookings: Booking[] = data.slice(0, 2).map((slot: any, i: number) => ({
          id: `booking-${i}`,
          slot_id: slot.id,
          client_id: 'mock-client-id',
          status: i === 0 ? 'pending' : 'completed',
          created_at: new Date().toISOString(),
          slots: { ...slot, barbershops: slot.barbershops }
        }));
        setBookings(mockBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;
    
    try {
      const response = await fetch('/api/reservations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: id })
      });

      if (response.ok) {
        setBookings(prev => prev.filter(b => b.id !== id));
        alert('Reserva cancelada com sucesso.');
      }
    } catch (error) {
      console.error('Cancel error:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
          <User size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-zinc-900 leading-tight">Olá, Cliente</h1>
          <p className="text-sm text-zinc-500">Gerencie seus agendamentos</p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Calendar size={14} />
          Próximos Agendamentos
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : bookings.filter(b => b.status === 'pending').length > 0 ? (
          <div className="space-y-4">
            {bookings.filter(b => b.status === 'pending').map((booking) => (
              <motion.div 
                key={booking.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400">
                      <Scissors size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 text-sm">{booking.slots?.barbershops?.name}</h3>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Pendente</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-zinc-900">R$ {booking.slots?.discounted_price.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-zinc-50 rounded-xl p-3 flex items-center gap-2">
                    <Clock size={14} className="text-emerald-500" />
                    <span className="text-xs font-bold text-zinc-700">
                      {booking.slots && format(new Date(booking.slots.start_time), "HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-3 flex items-center gap-2">
                    <Calendar size={14} className="text-emerald-500" />
                    <span className="text-xs font-bold text-zinc-700">
                      {booking.slots && format(new Date(booking.slots.start_time), "dd/MM", { locale: ptBR })}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => handleCancel(booking.id)}
                  className="w-full py-3 text-xs font-bold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle size={14} />
                  Cancelar Reserva
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
            <p className="text-sm text-zinc-400 font-medium">Nenhum agendamento pendente.</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <History size={14} />
          Histórico
        </h2>
        <div className="space-y-3">
          {bookings.filter(b => b.status !== 'pending').map((booking) => (
            <div key={booking.id} className="bg-white border border-zinc-50 rounded-2xl p-4 flex items-center justify-between opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center text-zinc-300">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">{booking.slots?.barbershops?.name}</h4>
                  <p className="text-[10px] text-zinc-400">
                    {booking.slots && format(new Date(booking.slots.start_time), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-zinc-400">R$ {booking.slots?.discounted_price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
