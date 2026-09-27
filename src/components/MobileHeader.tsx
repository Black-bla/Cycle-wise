import React from 'react';
import { ShieldCheck, Store, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  networkSmeCount: number;
  onStartOnboarding?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onStartOnboarding }) => {
  return (
    <header className="md:hidden sticky top-0 z-30 bg-primary text-primary-foreground px-4 py-3 border-b shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <RefreshCw className="size-4" />
          </div>
          <div>
            <span className="font-semibold tracking-tight text-base block">Cyclewise</span>
            <p className="text-[11px] text-primary-foreground/70 leading-none">Trade without cash</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-[11px] bg-primary-foreground/10 px-2 py-1 rounded-md">
            <ShieldCheck className="size-3.5 text-(--color-leaf-green)" />
            <span>Human Approved</span>
          </div>
          {onStartOnboarding && (
            <Button size="sm" variant="secondary" onClick={onStartOnboarding}>
              <Store data-icon="inline-start" />
              Add Business
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
