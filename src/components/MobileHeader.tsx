import React from 'react';
import { Network, ShieldCheck, Sparkles, Activity, Store } from 'lucide-react';

interface MobileHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  networkSmeCount: number;
  onStartOnboarding?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ networkSmeCount, onStartOnboarding }) => {
  return (
    <header className="sticky top-0 z-30 bg-[#18243A] text-white px-4 py-3 border-b border-[#253654] shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E7B84B] flex items-center justify-center text-[#18243A] font-bold text-lg shadow-xs">
            ↻
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold tracking-tight text-white text-base">Cyclewise</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#2E8B68]/30 text-[#85E2BD] font-medium border border-[#2E8B68]/50">
                Agent M0
              </span>
            </div>
            <p className="text-[11px] text-[#A6B2C3] leading-none">Kenya SME Exchange Coordinator</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onStartOnboarding && (
            <button
              onClick={onStartOnboarding}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-[#E7B84B] text-[#18243A] font-bold text-xs hover:bg-[#d8a839] transition-colors shadow-xs"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Onboard</span>
            </button>
          )}

          <div className="flex items-center space-x-1 bg-[#23334F] text-[#E7B84B] text-xs px-2.5 py-1 rounded-md border border-[#324970]">
            <Activity className="w-3.5 h-3.5 animate-pulse text-[#E7B84B]" />
            <span className="font-medium text-[11px]">Nairobi ({networkSmeCount})</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1 text-[11px] bg-[#23334F] text-slate-200 px-2 py-1 rounded-md border border-[#324970]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2E8B68]" />
            <span>Human Gated</span>
          </div>
        </div>
      </div>
    </header>
  );
};
