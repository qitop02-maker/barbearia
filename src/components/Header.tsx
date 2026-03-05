import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scissors, User, Store, LogIn } from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-4 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
          <Scissors size={18} />
        </div>
        <span className="font-black text-lg tracking-tight">BarberNow</span>
      </Link>

      {!isAuthPage && (
        <nav className="flex items-center gap-4">
          <Link to="/client" className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors">
            <User size={20} />
          </Link>
          <Link to="/shop" className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors">
            <Store size={20} />
          </Link>
          <Link to="/auth" className="flex items-center gap-1.5 bg-zinc-100 px-3 py-1.5 rounded-full text-xs font-bold text-zinc-600">
            <LogIn size={14} />
            <span>Entrar</span>
          </Link>
        </nav>
      )}
    </header>
  );
};
