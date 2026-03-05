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

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F9FAFB] text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
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
  );
}
