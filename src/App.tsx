/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { SlotDetails } from './pages/SlotDetails';
import { Auth } from './pages/Auth';
import { ClientDashboard } from './pages/ClientDashboard';
import { ShopDashboard } from './pages/ShopDashboard';
import { AuthProvider } from './lib/AuthContext';
import { isSupabaseConfigured } from './lib/supabase';
import { AlertCircle, ExternalLink } from 'lucide-react';

const ConfigMissingBanner = () => {
  const [diagnostics, setDiagnostics] = React.useState<{ hasUrl: boolean; hasKey: boolean } | null>(null);

  React.useEffect(() => {
    setDiagnostics({
      hasUrl: !!import.meta.env.VITE_SUPABASE_URL || !!(window as any).process?.env?.VITE_SUPABASE_URL,
      hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY || !!(window as any).process?.env?.VITE_SUPABASE_ANON_KEY
    });
  }, []);

  return (
    <div className="bg-red-50 border-b border-red-100 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle size={20} className="shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Configuração do Supabase incompleta!</p>
            <p className="opacity-90">
              Detectado: {diagnostics?.hasUrl ? '✅ URL' : '❌ URL'} | {diagnostics?.hasKey ? '✅ Chave' : '❌ Chave'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="text-xs font-bold text-red-700 hover:underline bg-white/50 px-3 py-1.5 rounded-md border border-red-200"
          >
            Já configurei, recarregar
          </button>
          <a 
            href="https://supabase.com/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-800 transition-colors bg-white px-3 py-1.5 rounded-full border border-red-200 shadow-sm"
          >
            Abrir Supabase <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const isConfigured = isSupabaseConfigured();

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#F9FAFB] text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
          {!isConfigured && <ConfigMissingBanner />}
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/slot/:id" element={<SlotDetails />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/client" element={<ClientDashboard />} />
              <Route path="/shop" element={<ShopDashboard />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
