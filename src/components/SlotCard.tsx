import React from 'react';
import { MapPin, Clock, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Slot } from '../types';
import { DiscountBadge } from './DiscountBadge';
import { Link } from 'react-router-dom';

interface SlotCardProps {
  slot: Slot;
}

export const SlotCard: React.FC<SlotCardProps> = ({ slot }) => {
  const shop = slot.barbershops;
  
  return (
    <Link 
      to={`/slot/${slot.id}`}
      className="block bg-white border border-zinc-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center overflow-hidden">
            {shop?.logo_url ? (
              <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Scissors size={20} className="text-zinc-400" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 leading-tight">{shop?.name || 'Barbearia'}</h3>
            <div className="flex items-center gap-1 text-zinc-500 text-xs">
              <MapPin size={12} />
              <span>{shop?.city || 'Cidade'}</span>
            </div>
          </div>
        </div>
        <DiscountBadge original={slot.original_price} discounted={slot.discounted_price} />
      </div>

      <div className="flex items-center gap-4 py-3 border-y border-zinc-50 mb-3">
        <div className="flex items-center gap-1.5 text-zinc-600 text-sm">
          <Clock size={14} className="text-emerald-500" />
          <span className="font-medium">
            {format(new Date(slot.start_time), "HH:mm", { locale: ptBR })}
          </span>
        </div>
        <div className="text-xs text-zinc-400">
          {format(new Date(slot.start_time), "dd 'de' MMM", { locale: ptBR })}
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Preço Final</p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-zinc-900">R$ {slot.discounted_price.toFixed(2)}</span>
            <span className="text-xs text-zinc-400 line-through">R$ {slot.original_price.toFixed(2)}</span>
          </div>
        </div>
        <div className="bg-zinc-900 text-white text-xs font-bold px-4 py-2 rounded-xl">
          Reservar
        </div>
      </div>
    </Link>
  );
};
