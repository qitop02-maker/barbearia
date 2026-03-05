import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, User, Scissors, ArrowRight } from 'lucide-react';
import { getClientSupabase } from '../lib/supabase';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'client' | 'barbershop'>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getClientSupabase();
    if (!supabase) {
      setError('Configuração do Supabase ausente. Verifique as variáveis de ambiente.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });
        if (error) throw error;
        alert('Conta criada! Verifique seu e-mail para confirmar (se habilitado) ou faça login.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-zinc-200">
          <Scissors size={32} />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 mb-2">
          {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
        </h1>
        <p className="text-zinc-500 text-sm">
          {isLogin ? 'Entre para gerenciar seus cortes' : 'Comece a economizar em seus cortes hoje'}
        </p>
      </div>

      <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm mb-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl">
            {error}
          </div>
        )}

        {!isLogin && (
          <div className="flex p-1 bg-zinc-100 rounded-xl mb-6">
            <button 
              onClick={() => setRole('client')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === 'client' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
            >
              Sou Cliente
            </button>
            <button 
              onClick={() => setRole('barbershop')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === 'barbershop' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
            >
              Sou Barbearia
            </button>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center text-zinc-400">
                <User size={18} />
              </div>
              <input 
                type="text" 
                required
                placeholder="Nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          )}
          
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center text-zinc-400">
              <Mail size={18} />
            </div>
            <input 
              type="email" 
              required
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center text-zinc-400">
              <Lock size={18} />
            </div>
            <input 
              type="password" 
              required
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-zinc-900 text-white font-black py-4 rounded-2xl shadow-lg shadow-zinc-200 flex items-center justify-center gap-2 group active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? 'Entrar' : 'Criar Conta'}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="text-center">
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre agora'}
        </button>
      </div>
    </div>
  );
};
