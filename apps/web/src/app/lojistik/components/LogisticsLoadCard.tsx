'use client';

interface LoadCardProps {
  loadType: 'FTL' | 'LTL';
  loadTypeLabel: string;
  adNumber: string;
  pickupCity: string;
  pickupDistrict: string;
  deliveryCity: string;
  deliveryDistrict: string;
  pallets: number;
  weight: number;
  volume: number;
  specialTags?: Array<{
    label: string;
    icon: string;
    color: 'orange' | 'purple' | 'default';
  }>;
  loadDate: string;
  timeLeft: string;
  timeLeftColor: 'red' | 'amber';
  loadTypeColor: 'blue' | 'emerald';
}

export function LogisticsLoadCard({
  loadType,
  loadTypeLabel,
  adNumber,
  pickupCity,
  pickupDistrict,
  deliveryCity,
  deliveryDistrict,
  pallets,
  weight,
  volume,
  specialTags,
  loadDate,
  timeLeft,
  timeLeftColor,
  loadTypeColor,
}: LoadCardProps) {
  const loadTypeColors = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
  };

  const timeLeftColors = {
    red: 'text-red-600',
    amber: 'text-amber-600',
  };

  const specialTagColors = {
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    default: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Route Info */}
          <div className="flex-1">
            <div className={`flex items-center gap-2 text-xs font-semibold ${loadTypeColors[loadTypeColor]} mb-2 tracking-wide uppercase`}>
              <span className="material-symbols-outlined text-sm">local_shipping</span>
              {loadTypeLabel}
              <span className="text-slate-300 mx-1">•</span>
              İlan No: #{adNumber}
            </div>
            
            {/* Route Display */}
            <div className="flex items-center gap-4 mb-4">
              {/* Pickup */}
              <div>
                <div className="text-sm text-slate-500 font-medium">Yükleme</div>
                <div className="text-lg font-bold text-slate-900 font-headline">{pickupCity}</div>
                <div className="text-sm text-slate-600">{pickupDistrict}</div>
              </div>
              
              {/* Arrow */}
              <div className="flex flex-col items-center px-4 text-slate-300">
                <span className="material-symbols-outlined">arrow_forward</span>
                <div className="h-px w-16 bg-slate-200 mt-1"></div>
              </div>
              
              {/* Delivery */}
              <div>
                <div className="text-sm text-slate-500 font-medium">Teslimat</div>
                <div className="text-lg font-bold text-slate-900 font-headline">{deliveryCity}</div>
                <div className="text-sm text-slate-600">{deliveryDistrict}</div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {/* Weight Badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                {pallets} Palet
              </span>

              {/* Volume Badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                <span className="material-symbols-outlined text-[14px]">scale</span>
                {weight} KG
              </span>

              {/* Size Badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                <span className="material-symbols-outlined text-[14px]">view_in_ar</span>
                {volume} m3 Hacim
              </span>

              {/* Special Tags */}
              {specialTags?.map((tag, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${specialTagColors[tag.color]}`}
                >
                  <span className="material-symbols-outlined text-[14px]">{tag.icon}</span>
                  {tag.label}
                </span>
              ))}
            </div>
          </div>

          {/* Action & Meta */}
          <div className="flex flex-col lg:items-end justify-between min-w-[200px] border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
            <div className="mb-4 lg:text-right w-full">
              <div className="flex items-center lg:justify-end gap-1.5 text-sm text-slate-600 mb-1">
                <span className="material-symbols-outlined text-sm">calendar_month</span>
                <span>Yükleme: <strong>{loadDate}</strong></span>
              </div>
              <div className={`flex items-center lg:justify-end gap-1.5 text-xs ${timeLeftColors[timeLeftColor]} font-medium`}>
                <span className="material-symbols-outlined text-[14px]">timer</span>
                <span>Son Teklif: {timeLeft}</span>
              </div>
            </div>
            <button className="w-full lg:w-auto bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors focus:ring-4 focus:ring-blue-100">
              Teklif Ver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
