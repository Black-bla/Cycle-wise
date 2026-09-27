import React from 'react';
import { Send, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

const navItems = [
  { id: 'home', label: 'Home', icon: Send },
  { id: 'exchanges', label: 'Exchanges', icon: Clock },
  { id: 'network', label: 'Network', icon: Users },
];

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t shadow-lg">
      <div className="grid grid-cols-3 h-16 max-w-md mx-auto items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={cn(
                'flex flex-col items-center justify-center h-full py-1 focus:outline-hidden transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-5" strokeWidth={isActive ? 2.4 : 1.8} />
              <span className={cn('text-[11px] mt-1', isActive ? 'font-semibold' : 'font-normal')}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
