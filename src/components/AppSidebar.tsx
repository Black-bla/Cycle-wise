import * as React from 'react';
import {
  Send,
  Clock,
  Users,
  Store,
  RefreshCw,
  ShieldCheck,
  Sun,
  Moon,
  Monitor,
  Check,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/lib/theme-provider';

const THEME_OPTIONS = [
  { id: 'light' as const, label: 'Light', icon: Sun },
  { id: 'dark' as const, label: 'Dark', icon: Moon },
  { id: 'system' as const, label: 'System', icon: Monitor },
];

function ThemeMenuItem() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const ActiveIcon = theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger render={<SidebarMenuButton />}>
          <ActiveIcon />
          <span>Theme</span>
          <span className="ml-auto text-xs text-sidebar-foreground/60 capitalize">{theme}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-40">
          {THEME_OPTIONS.map((opt) => (
            <DropdownMenuItem key={opt.id} onClick={() => setTheme(opt.id)}>
              <opt.icon />
              <span>{opt.label}</span>
              {theme === opt.id && <Check className="ml-auto size-3.5" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

export type CyclewiseTab = 'home' | 'exchanges' | 'network';

const NAV_ITEMS: { id: CyclewiseTab; title: string; icon: React.ElementType }[] = [
  { id: 'home', title: 'Home', icon: Send },
  { id: 'exchanges', title: 'My Exchanges', icon: Clock },
  { id: 'network', title: 'Network', icon: Users },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentTab: CyclewiseTab;
  onSelectTab: (tab: CyclewiseTab) => void;
  onResetDemo: () => void;
  onStartOnboarding: () => void;
}

export function AppSidebar({
  currentTab,
  onSelectTab,
  onResetDemo,
  onStartOnboarding,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => onSelectTab('home')}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <RefreshCw className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">Cyclewise</span>
                <span className="text-xs text-sidebar-foreground/70">Trade without cash</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={currentTab === item.id}
                    onClick={() => onSelectTab(item.id)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onStartOnboarding}>
                  <Store />
                  <span>Add Your Business</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-1.5 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-xs text-sidebar-foreground/80">
          <ShieldCheck className="size-3.5 shrink-0 text-(--color-leaf-green)" />
          <span>Every exchange needs approval from everyone involved. No loans, ever.</span>
        </div>

        <SidebarSeparator className="mx-0" />

        <SidebarMenu>
          <ThemeMenuItem />
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onResetDemo}>
              <RefreshCw />
              <span>Reset Sample Data</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
