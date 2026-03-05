import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, Scissors, ArrowRight } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'client' | 'barbershop'>('client');

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

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {!isLogin && (
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center text-zinc-400">
                <User size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Nome completo"
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
              placeholder="E-mail"
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center text-zinc-400">
              <Lock size={18} />
            </div>
            <input 
              type="password" 
              placeholder="Senha"
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <button className="w-full bg-zinc-900 text-white font-black py-4 rounded-2xl shadow-lg shadow-zinc-200 flex items-center justify-center gap-2 group active:scale-[0.98] transition-all">
            {isLogin ? 'Entrar' : 'Criar Conta'}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
