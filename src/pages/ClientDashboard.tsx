import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, XCircle, CheckCircle2, Scissors, History, User, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Booking } from '../types';
import { useAuth } from '../lib/AuthContext';

export const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, session, signOut, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/reservations/client', {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        });
        const data = await response.json();
        setBookings(data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, authLoading, navigate, session]);

  const handleCancel = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;
    
    try {
      const response = await fetch('/api/reservations/cancel', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ booking_id: id })
      });

      if (response.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
        alert('Reserva cancelada com sucesso.');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao cancelar');
      }
    } catch (error) {
      console.error('Cancel error:', error);
    }
  };

  if (authLoading || loading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
            ) : (
              <User size={32} />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 leading-tight">Olá, {profile?.full_name?.split(' ')[0] || 'Cliente'}</h1>
            <p className="text-sm text-zinc-500">Gerencie seus agendamentos</p>
          </div>
        </div>
        <button 
          onClick={() => { signOut(); navigate('/'); }}
          className="w-10 h-10 bg-zinc-100 text-zinc-500 rounded-xl flex items-center justify-center hover:bg-zinc-200 transition-colors"
        >
          <LogOut size={20} />
        </button>
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
