import React from 'react';
import { Home, PlusCircle, GitMerge, Clock, UserCheck } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const navItems = [
    { id: 'network', label: 'Network', icon: Home },
    { id: 'request', label: 'Tell Cyclewise', icon: PlusCircle, isPrimary: true },
    { id: 'matches', label: 'Matches', icon: GitMerge },
    { id: 'exchanges', label: 'Exchanges', icon: Clock },
    { id: 'profile', label: 'Evidence', icon: UserCheck },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] border-t border-[#E3E0D7] shadow-lg">
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          if (item.isPrimary) {
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className="flex flex-col items-center justify-center -mt-4 group focus:outline-hidden"
                aria-label={item.label}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform ${
                  isActive ? 'bg-[#18243A] text-[#E7B84B] scale-105' : 'bg-[#E7B84B] text-[#18243A] hover:scale-105'
                }`}>
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-semibold text-[#18243A] mt-1">
                  Tell Cyclewise
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center h-full py-1 focus:outline-hidden transition-colors ${
                isActive ? 'text-[#18243A]' : 'text-[#68727D] hover:text-[#18243A]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4] text-[#18243A]' : 'stroke-[1.8]'}`} />
              <span className={`text-[10px] mt-1 ${isActive ? 'font-semibold text-[#18243A]' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
