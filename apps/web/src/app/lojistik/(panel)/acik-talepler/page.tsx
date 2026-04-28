'use client';

import { useState } from 'react';
import { LogisticsLoadCard } from '../../components/LogisticsLoadCard';

export default function AcikTaleplerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-near');

  const loads = [
    {
      loadType: 'FTL' as const,
      loadTypeLabel: 'Komple Yük (FTL)',
      adNumber: 'TR-8492',
      pickupCity: 'İSTANBUL',
      pickupDistrict: 'Zeytinburnu',
      deliveryCity: 'ANKARA',
      deliveryDistrict: 'Çankaya',
      pallets: 10,
      weight: 4500,
      volume: 15,
      specialTags: [
        { label: 'Frigofirik', icon: 'ac_unit', color: 'orange' as const },
      ],
      loadDate: '12 Eki 2023',
      timeLeft: '4 Saat Kaldı',
      timeLeftColor: 'red' as const,
      loadTypeColor: 'blue' as const,
    },
    {
      loadType: 'LTL' as const,
      loadTypeLabel: 'Parsiyel Yük (LTL)',
      adNumber: 'TR-8501',
      pickupCity: 'İZMİR',
      pickupDistrict: 'Kemalpaşa',
      deliveryCity: 'BURSA',
      deliveryDistrict: 'Nilüfer',
      pallets: 4,
      weight: 1200,
      volume: 6,
      specialTags: [],
      loadDate: '14 Eki 2023',
      timeLeft: '1 Gün Kaldı',
      timeLeftColor: 'amber' as const,
      loadTypeColor: 'emerald' as const,
    },
    {
      loadType: 'FTL' as const,
      loadTypeLabel: 'Komple Yük (FTL)',
      adNumber: 'TR-8522',
      pickupCity: 'KOCAELİ',
      pickupDistrict: 'Gebze',
      deliveryCity: 'ADANA',
      deliveryDistrict: 'Seyhan',
      pallets: 22,
      weight: 18000,
      volume: 60,
      specialTags: [
        { label: 'Tehlikeli Madde (ADR)', icon: 'warning', color: 'purple' as const },
      ],
      loadDate: '16 Eki 2023',
      timeLeft: '2 Gün Kaldı',
      timeLeftColor: 'amber' as const,
      loadTypeColor: 'blue' as const,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
            </div>
            <input
              type="text"
              placeholder="Rota veya İlan No Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Filtrele
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-slate-50"
          >
            <option value="date-near">Tarihe Göre (Yakın)</option>
            <option value="date-far">Tarihe Göre (Uzak)</option>
            <option value="weight">Ağırlığa Göre</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {loads.map((load, idx) => (
          <LogisticsLoadCard key={idx} {...load} />
        ))}
      </div>
    </div>
  );
}
