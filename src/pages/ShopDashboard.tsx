import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Calendar, Clock, Users, Scissors, CheckCircle2, XCircle, TrendingUp, DollarSign, LayoutDashboard, PlusCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Slot, Booking } from '../types';

export const ShopDashboard: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [startTime, setStartTime] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/slots');
        const data = await response.json();
        setSlots(data);
        
        // Mock bookings for the shop
        const mockBookings: Booking[] = data.slice(0, 1).map((slot: any, i: number) => ({
          id: `booking-shop-${i}`,
          slot_id: slot.id,
          client_id: 'client-123',
          status: 'pending',
          created_at: new Date().toISOString(),
          slots: { ...slot, barbershops: slot.barbershops }
        }));
        setBookings(mockBookings);
      } catch (error) {
        console.error('Error fetching shop data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/slots/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barbershop_id: 'mock-shop-id', // In real app, get from shop profile
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(new Date(startTime).getTime() + 30 * 60000).toISOString(), // 30 min duration
          original_price: parseFloat(originalPrice),
          discounted_price: parseFloat(discountedPrice)
        })
      });

      if (response.ok) {
        const newSlot = await response.json();
        setSlots(prev => [newSlot, ...prev]);
        setShowCreate(false);
        setStartTime('');
        setOriginalPrice('');
        setDiscountedPrice('');
        alert('Vaga criada com sucesso!');
      }
    } catch (error) {
      console.error('Create slot error:', error);
    }
  };

  const handleCheckIn = async (id: string) => {
    try {
      const response = await fetch('/api/reservations/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: id })
      });
      if (response.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b));
      }
    } catch (error) {
      console.error('Check-in error:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-32">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-zinc-200">
            <Scissors size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-900 leading-tight">Barbearia Elite</h1>
            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Painel Administrativo</p>
          </div>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 active:scale-90 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 mb-3">
            <Calendar size={18} />
          </div>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Vagas Ativas</p>
          <p className="text-2xl font-black text-zinc-900">{slots.length}</p>
        </div>
        <div className="bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 mb-3">
            <DollarSign size={18} />
          </div>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Receita Est.</p>
          <p className="text-2xl font-black text-zinc-900">R$ 450</p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Users size={14} />
          Reservas de Hoje
        </h2>

        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400">
                      <User size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 text-sm">João Silva</h3>
                      <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                        {booking.status === 'pending' ? 'Aguardando' : 'Confirmado'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-zinc-900">
                      {booking.slots && format(new Date(booking.slots.start_time), "HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                
                {booking.status === 'pending' && (
                  <button 
                    onClick={() => handleCheckIn(booking.id)}
                    className="w-full py-3 bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={14} />
                    Confirmar Chegada
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
            <p className="text-sm text-zinc-400 font-medium">Nenhuma reserva para hoje.</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <LayoutDashboard size={14} />
          Suas Vagas
        </h2>
        <div className="space-y-3">
          {slots.map((slot) => (
            <div key={slot.id} className="bg-white border border-zinc-50 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center text-zinc-400">
                  <Clock size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">
                    {format(new Date(slot.start_time), "HH:mm", { locale: ptBR })}
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    {format(new Date(slot.start_time), "dd/MM", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-zinc-900">R$ {slot.discounted_price.toFixed(2)}</p>
                <p className="text-[10px] text-emerald-500 font-bold">-{Math.round(((slot.original_price - slot.discounted_price) / slot.original_price) * 100)}%</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Create Slot Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-[40px] p-8 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-zinc-100 rounded-full mx-auto mb-8" />
              <h2 className="text-2xl font-black text-zinc-900 mb-6">Nova Vaga</h2>
              
              <form onSubmit={handleCreateSlot} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Horário de Início</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Preço Original</label>
                    <input 
                      type="number" 
                      placeholder="R$ 50,00"
                      required
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Preço com Desconto</label>
                    <input 
                      type="number" 
                      placeholder="R$ 35,00"
                      required
                      value={discountedPrice}
                      onChange={(e) => setDiscountedPrice(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-zinc-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-zinc-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <PlusCircle size={20} />
                  Publicar Vaga
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
