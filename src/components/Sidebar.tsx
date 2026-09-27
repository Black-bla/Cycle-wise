import React from 'react';
import { Home, PlusCircle, GitMerge, Clock, UserCheck, Shield, Cpu, RefreshCw } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onResetDemo: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onResetDemo }) => {
  const links = [
    { id: 'network', label: 'Network Overview', icon: Home },
    { id: 'request', label: 'Tell Cyclewise', icon: PlusCircle, isPrimary: true },
    { id: 'matches', label: 'Exchange Matches', icon: GitMerge },
    { id: 'exchanges', label: 'Active Exchanges', icon: Clock },
    { id: 'profile', label: 'Trust Evidence', icon: UserCheck },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 bg-[#18243A] text-white shrink-0 border-r border-[#263753] min-h-screen">
      {/* Brand */}
      <div className="p-4 border-b border-[#263753]">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E7B84B] flex items-center justify-center text-[#18243A] font-bold text-xl shadow-xs">
            ↻
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight tracking-tight text-white">Cyclewise</h1>
            <p className="text-[11px] text-[#A6B2C3]">SME Exchange Coordinator</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1.5 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = currentTab === link.id;

          if (link.isPrimary) {
            return (
              <button
                key={link.id}
                onClick={() => onSelectTab(link.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all mb-3 text-left ${
                  isActive
                    ? 'bg-[#E7B84B] text-[#18243A] shadow-md'
                    : 'bg-[#E7B84B]/90 text-[#18243A] hover:bg-[#E7B84B]'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2.5]" />
                <span>{link.label}</span>
              </button>
            );
          }

          return (
            <button
              key={link.id}
              onClick={() => onSelectTab(link.id)}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                isActive
                  ? 'bg-[#253752] text-white font-semibold'
                  : 'text-[#A6B2C3] hover:bg-[#1E2D43] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Agent & Architecture Facts Box */}
      <div className="p-3 mx-3 mb-3 bg-[#131D2F] rounded-lg border border-[#263753] text-[11px] space-y-2">
        <div className="flex items-center space-x-1.5 text-[#E7B84B] font-semibold">
          <Cpu className="w-3.5 h-3.5" />
          <span>Domain Separation</span>
        </div>
        <p className="text-[#8E9CAE] leading-relaxed">
          <strong className="text-white">Gemini:</strong> Multilingual intent extraction & grounded explanations.
        </p>
        <p className="text-[#8E9CAE] leading-relaxed">
          <strong className="text-white">Deterministic:</strong> Graph cycle DFS, constraints, score & state tracking.
        </p>
        <div className="pt-1.5 border-t border-[#263753] flex items-center justify-between text-[#2E8B68]">
          <span className="flex items-center space-x-1">
            <Shield className="w-3 h-3 text-[#2E8B68]" />
            <span>Human-in-the-loop</span>
          </span>
          <span className="text-[10px] text-[#A6B2C3]">M0 Verified</span>
        </div>
      </div>

      {/* Demo Reset Action */}
      <div className="p-3 border-t border-[#263753]">
        <button
          onClick={onResetDemo}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-md bg-[#253752] hover:bg-[#314668] text-[11px] font-medium text-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Demo Fixture</span>
        </button>
      </div>
    </aside>
  );
};
