import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Calendar, Clock, Users, Scissors, CheckCircle2, XCircle, TrendingUp, DollarSign, LayoutDashboard, PlusCircle, User, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Slot, Booking, Barbershop } from '../types';
import { useAuth } from '../lib/AuthContext';

export const ShopDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, session, signOut, loading: authLoading } = useAuth();
  const [shop, setShop] = useState<Barbershop | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopAddress, setNewShopAddress] = useState('');
  const [newShopCity, setNewShopCity] = useState('');

  // Form state
  const [startTime, setStartTime] = useState('');
  const [serviceName, setServiceName] = useState('Corte de Cabelo');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');

  useEffect(() => {
    let isMounted = true;
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${session?.access_token}` };
        
        // 1. Fetch shop info
        const shopRes = await fetch('/api/shop/me', { headers });
        if (shopRes.ok) {
          const shopData = await shopRes.json();
          if (isMounted) setShop(shopData);
        } else if (shopRes.status === 404) {
          // Shop not created yet, this is fine
          if (isMounted) setShop(null);
        }

        // 2. Fetch slots
        const slotsRes = await fetch('/api/slots/shop', { headers }); 
        if (slotsRes.ok) {
          const slotsData = await slotsRes.json();
          if (isMounted) setSlots(slotsData);
        }

        // 3. Fetch bookings
        const bookingsRes = await fetch('/api/reservations/shop', { headers });
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          if (isMounted) setBookings(bookingsData);
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching data:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [user, authLoading, navigate, session]);

  const [creating, setCreating] = useState(false);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[Dashboard] Submit triggered');

    if (!session?.access_token) {
      alert('Sua sessão expirou. Por favor, faça login novamente.');
      navigate('/auth');
      return;
    }

    if (!shop) {
      alert('Erro: Dados da barbearia não encontrados. Tente recarregar a página.');
      return;
    }

    if (!serviceName || !startTime || !originalPrice || !discountedPrice) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const parsePrice = (val: string) => {
      if (typeof val !== 'string') return 0;
      return parseFloat(val.replace(',', '.'));
    };

    const oPrice = parsePrice(originalPrice);
    const dPrice = parsePrice(discountedPrice);

    if (isNaN(oPrice) || oPrice <= 0) {
      alert('Preço original inválido. Use apenas números (ex: 50 ou 50.00).');
      return;
    }

    if (isNaN(dPrice) || dPrice <= 0) {
      alert('Preço com desconto inválido. Use apenas números (ex: 35 ou 35.00).');
      return;
    }

    if (dPrice >= oPrice) {
      alert('O preço com desconto deve ser menor que o preço original.');
      return;
    }

    setCreating(true);

    try {
      const startDate = new Date(startTime);
      if (isNaN(startDate.getTime())) {
        alert('Horário inválido.');
        setCreating(false);
        return;
      }

      const startTimeISO = startDate.toISOString();
      const endTimeISO = new Date(startDate.getTime() + 30 * 60000).toISOString();

      const payload = {
        barbershop_id: shop.id,
        service_name: serviceName,
        start_time: startTimeISO,
        end_time: endTimeISO,
        original_price: oPrice,
        discounted_price: dPrice
      };

      console.log('[Dashboard] Sending payload:', payload);

      const apiUrl = '/api/slots/create';
      console.log(`[Dashboard] Fetching: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      console.log('[Dashboard] Server response status:', response.status);

      if (response.ok) {
        const newSlot = await response.json();
        setSlots(prev => [newSlot, ...prev]);
        setShowCreate(false);
        setStartTime('');
        setOriginalPrice('');
        setDiscountedPrice('');
        alert('Vaga publicada com sucesso!');
      } else {
        const text = await response.text();
        console.error('[Dashboard] Server raw response:', text);
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch (e) {
          errorData = { error: `Erro no servidor (${response.status}): ${text.substring(0, 100)}` };
        }
        alert(`Erro ao publicar: ${errorData.error || 'Verifique os dados e tente novamente.'}`);
      }
    } catch (error: any) {
      console.error('[Dashboard] Fetch error details:', {
        message: error.message,
        stack: error.stack,
        error
      });
      alert(`Erro de conexão: ${error.message || 'Não foi possível contatar o servidor.'}\n\nVerifique se o servidor está rodando e se você tem conexão com a internet.`);
    } finally {
      setCreating(false);
    }
  };

  const handleCheckIn = async (id: string) => {
    try {
      const response = await fetch('/api/reservations/checkin', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ booking_id: id })
      });
      if (response.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b));
      }
    } catch (error) {
      console.error('Check-in error:', error);
    }
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !session) return;

    try {
      const { getSupabase } = await import('../lib/supabase');
      const supabase = getSupabase(session.access_token);
      if (!supabase) return;

      const { data, error } = await supabase
        .from('barbershops')
        .insert([{
          owner_id: user.id,
          name: newShopName,
          address: newShopAddress,
          city: newShopCity,
          is_verified: false
        }])
        .select()
        .single();

      if (error) throw error;
      setShop(data);
      alert('Barbearia cadastrada com sucesso!');
    } catch (error: any) {
      alert(error.message || 'Erro ao cadastrar barbearia');
    }
  };

  if (authLoading || loading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  if (!shop) {
    return (
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-xl shadow-emerald-50">
            <Scissors size={32} />
          </div>
          <h1 className="text-3xl font-black text-zinc-900 mb-2">Configure sua Barbearia</h1>
          <p className="text-zinc-500 text-sm">Você precisa cadastrar sua barbearia para começar a publicar vagas.</p>
        </div>

        <form onSubmit={handleCreateShop} className="space-y-6 bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm">
          <div>
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Nome da Barbearia</label>
            <input 
              type="text" 
              required
              placeholder="Ex: Barbearia do Zé"
              value={newShopName}
              onChange={(e) => setNewShopName(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Endereço</label>
            <input 
              type="text" 
              required
              placeholder="Rua Exemplo, 123"
              value={newShopAddress}
              onChange={(e) => setNewShopAddress(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Cidade</label>
            <input 
              type="text" 
              required
              placeholder="São Paulo"
              value={newShopCity}
              onChange={(e) => setNewShopCity(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-zinc-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-zinc-200 active:scale-[0.98] transition-all"
          >
            Cadastrar Barbearia
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-32">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-zinc-200 overflow-hidden">
            {shop?.logo_url ? (
              <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Scissors size={28} />
            )}
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-900 leading-tight">{shop?.name || 'Sua Barbearia'}</h1>
            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Painel Administrativo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowCreate(true)}
            className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 active:scale-90 transition-all"
          >
            <Plus size={24} />
          </button>
          <button 
            onClick={() => { signOut(); navigate('/'); }}
            className="w-12 h-12 bg-zinc-100 text-zinc-500 rounded-2xl flex items-center justify-center hover:bg-zinc-200 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
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
                    {slot.service_name}
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    {format(new Date(slot.start_time), "HH:mm 'em' dd/MM", { locale: ptBR })}
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
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Serviço</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Corte de Cabelo"
                    required
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

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
                  disabled={creating}
                  className="w-full bg-zinc-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-zinc-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <PlusCircle size={20} />
                      Publicar Vaga
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
