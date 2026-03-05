import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scissors, User, Store, LogIn, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export const Header: React.FC = () => {
  const location = useLocation();
  const { user, profile } = useAuth();
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
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              {profile?.role === 'barbershop' ? (
                <Link to="/shop" className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg shadow-zinc-200">
                  <LayoutDashboard size={14} />
                  <span>Painel Shop</span>
                </Link>
              ) : (
                <Link to="/client" className="flex items-center gap-1.5 bg-emerald-500 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg shadow-emerald-100">
                  <User size={14} />
                  <span>Minhas Reservas</span>
                </Link>
              )}
            </>
          ) : (
            <Link to="/auth" className="flex items-center gap-1.5 bg-zinc-100 px-4 py-2 rounded-full text-xs font-bold text-zinc-600 hover:bg-zinc-200 transition-all">
              <LogIn size={14} />
              <span>Entrar</span>
            </Link>
          )}
        </nav>
      )}
    </header>
  );
};
