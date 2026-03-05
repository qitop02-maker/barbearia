import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, Clock, Scissors, ChevronLeft, Calendar, ShieldCheck, Phone, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Slot } from '../types';
import { DiscountBadge } from '../components/DiscountBadge';

export const SlotDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [slot, setSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetchSlot = async () => {
      try {
        const response = await fetch(`/api/slots`);
        const data = await response.json();
        const found = data.find((s: Slot) => s.id === id);
        setSlot(found || null);
      } catch (error) {
        console.error('Error fetching slot:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlot();
  }, [id]);

  const handleReserve = async () => {
    if (!slot) return;
    setBooking(true);
    
    try {
      const response = await fetch('/api/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: slot.id,
          client_id: 'mock-client-id' // In a real app, get from auth
        })
      });

      if (response.ok) {
        alert('Reserva realizada com sucesso! Redirecionando para seu painel.');
        navigate('/client');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao realizar reserva');
      }
    } catch (error) {
      console.error('Booking error:', error);
    } finally {
      setBooking(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  if (!slot) return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold">Vaga não encontrada</h2>
      <button onClick={() => navigate('/')} className="mt-4 text-emerald-500 font-bold">Voltar para o início</button>
    </div>
  );

  const shop = slot.barbershops;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white pb-32">
      <div className="relative h-64 bg-zinc-900">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 z-10 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        {shop?.logo_url ? (
          <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <Scissors size={80} />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-900 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <DiscountBadge original={slot.original_price} discounted={slot.discounted_price} />
            <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Oferta Exclusiva</span>
          </div>
          <h1 className="text-3xl font-black text-white leading-tight">{shop?.name}</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
            <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Clock size={12} className="text-emerald-500" />
              Horário
            </div>
            <div className="text-lg font-black text-zinc-900">
              {format(new Date(slot.start_time), "HH:mm", { locale: ptBR })}
            </div>
          </div>
          <div className="flex-1 bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
            <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Calendar size={12} className="text-emerald-500" />
              Data
            </div>
            <div className="text-lg font-black text-zinc-900">
              {format(new Date(slot.start_time), "dd/MM", { locale: ptBR })}
            </div>
          </div>
        </div>

        <section className="mb-8">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <MapPin size={14} />
            Localização
          </h3>
          <div className="bg-white border border-zinc-100 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <p className="font-bold text-zinc-900 text-sm">{shop?.address}</p>
              <p className="text-xs text-zinc-500">{shop?.city}</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Info size={14} />
            Sobre o Serviço
          </h3>
          <p className="text-sm text-zinc-600 leading-relaxed">
            {shop?.description || "Aproveite esta vaga de última hora com um desconto especial. Qualidade garantida e atendimento imediato."}
          </p>
        </section>

        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 mb-8">
          <ShieldCheck className="text-emerald-600" size={20} />
          <p className="text-xs text-emerald-800 font-medium">
            Reserva garantida. Pague diretamente na barbearia após o serviço.
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-zinc-100 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Você paga apenas</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-900">R$ {slot.discounted_price.toFixed(2)}</span>
              <span className="text-sm text-zinc-400 line-through">R$ {slot.original_price.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-emerald-600 font-black text-sm">Economia de R$ {(slot.original_price - slot.discounted_price).toFixed(2)}</span>
          </div>
        </div>
        <button 
          onClick={handleReserve}
          disabled={booking}
          className="w-full bg-zinc-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {booking ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            "Confirmar Reserva"
          )}
        </button>
      </div>
    </div>
  );
};
