import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, Filter, Scissors } from 'lucide-react';
import { SlotCard } from '../components/SlotCard';
import { Slot } from '../types';

export const Home: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const response = await fetch(`/api/slots${city ? `?city=${city}` : ''}`);
        const data = await response.json();
        setSlots(data);
      } catch (error) {
        console.error('Error fetching slots:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [city]);

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 mb-2">
          Cortes com <span className="text-emerald-500">desconto</span> imediato.
        </h1>
        <p className="text-zinc-500 text-sm">
          Encontre barbearias com horários livres de última hora perto de você.
        </p>
      </motion.div>

      <div className="sticky top-20 z-40 bg-[#F9FAFB]/80 backdrop-blur-md py-4 mb-6">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-emerald-500 transition-colors">
            <MapPin size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Sua cidade (ex: São Paulo)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-zinc-900 flex items-center gap-2">
          <Filter size={16} className="text-zinc-400" />
          Vagas Disponíveis
        </h2>
        <span className="text-xs font-bold text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-full">
          {slots.length} resultados
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm font-bold text-zinc-400">Buscando as melhores ofertas...</p>
        </div>
      ) : slots.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {slots.map((slot, index) => (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <SlotCard slot={slot} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-zinc-100 rounded-3xl p-8">
          <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-300">
            <Scissors size={32} />
          </div>
          <h3 className="font-bold text-zinc-900 mb-1">Nenhuma vaga encontrada</h3>
          <p className="text-sm text-zinc-500">Tente buscar em outra cidade ou volte mais tarde.</p>
        </div>
      )}
    </div>
  );
};
