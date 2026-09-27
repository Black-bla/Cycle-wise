import React, { useState, useEffect, useMemo } from 'react';
import { MobileHeader } from './components/MobileHeader';
import { BottomNav } from './components/BottomNav';
import { AppSidebar, CyclewiseTab } from './components/AppSidebar';
import { TellCyclewiseSection } from './components/TellCyclewiseSection';
import { CycleCard } from './components/CycleCard';
import { ValueUnlockedSummaryCard } from './components/ValueUnlockedSummaryCard';
import { EvidencePanel } from './components/EvidencePanel';
import { ExchangesTracker } from './components/ExchangesTracker';
import { AgentInquiryModal } from './components/AgentInquiryModal';
import { SmeOnboardingModal } from './components/SmeOnboardingModal';
import { DeterministicGraphEngine, GraphSearchResult } from './engine/graphEngine';
import { SEEDED_SMES } from './engine/fixtures';
import { ExchangeCycle, SMEProfile } from './agent/types';
import { ShieldCheck, Users, Store } from 'lucide-react';

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function App() {
  const [currentTab, setCurrentTab] = useState<CyclewiseTab>('home');
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [inquiryCycle, setInquiryCycle] = useState<ExchangeCycle | null>(null);
  const [substituteMessage, setSubstituteMessage] = useState<string | null>(null);

  // Initialize engine & state
  const engine = useMemo(() => new DeterministicGraphEngine(), []);
  const [smes, setSmes] = useState<SMEProfile[]>(SEEDED_SMES);
  const smesMap = useMemo(() => {
    const map = new Map<string, SMEProfile>();
    smes.forEach((s) => map.set(s.id, s));
    return map;
  }, [smes]);

  const [cycles, setCycles] = useState<ExchangeCycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

  const activeSummaryCycle = useMemo(() => {
    if (cycles.length === 0) return null;
    return cycles.find((c) => c.id === selectedCycleId) || cycles[0];
  }, [cycles, selectedCycleId]);

  // Load initial matches
  useEffect(() => {
    engine.findCycles(4).then((res: GraphSearchResult) => {
      setCycles(res.cycles);
    });
  }, [engine]);

  const handleCommitCycle = (cycleId: string) => {
    setCycles((prev) =>
      prev.map((c) =>
        c.id === cycleId ? { ...c, status: 'Active' as const } : c
      )
    );
    setCurrentTab('exchanges');
  };

  const handleDeclineCycle = (cycleId: string) => {
    setCycles((prev) =>
      prev.map((c) =>
        c.id === cycleId ? { ...c, status: 'Failed' as const, risk_flags: ['A participant declined; try finding a replacement'] } : c
      )
    );
    setCurrentTab('exchanges');
  };

  const handleResetDemo = () => {
    engine.resetFixture();
    setSmes(SEEDED_SMES);
    engine.findCycles(4).then((res: GraphSearchResult) => {
      setCycles(res.cycles);
    });
  };

  const handleRequestSubstitute = async (declinedSmeId: string) => {
    setSubstituteMessage('Looking for a replacement…');
    try {
      const res = await fetch('/api/v1/agent/substitute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ declined_sme_id: declinedSmeId, cycle: activeSummaryCycle }),
      });
      const data = await res.json();
      if (data.substitute_found && data.revised_cycles?.length > 0) {
        setCycles(data.revised_cycles);
        setSelectedCycleId(data.revised_cycles[0].id);
        setSubstituteMessage('Found a replacement match below.');
      } else {
        setSubstituteMessage(data.recommendation || 'No replacement found yet — try adding more businesses to the network.');
      }
    } catch {
      setSubstituteMessage('Could not reach the matching service. Try again shortly.');
    }
    setTimeout(() => setSubstituteMessage(null), 6000);
  };

  const handleOnboardingComplete = (
    newSme: SMEProfile,
    newCycles: ExchangeCycle[],
    selectedCycle: ExchangeCycle | null
  ) => {
    setSmes((prev) => [...prev.filter((s) => s.id !== newSme.id), newSme]);
    setCycles(newCycles);
    if (selectedCycle) {
      setSelectedCycleId(selectedCycle.id);
    } else if (newCycles.length > 0) {
      setSelectedCycleId(newCycles[0].id);
    }
    setCurrentTab('home');
  };

  return (
    <SidebarProvider>
      <AppSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onResetDemo={handleResetDemo}
        onStartOnboarding={() => setShowOnboardingModal(true)}
      />

      <SidebarInset className="pb-20 md:pb-0">
        <MobileHeader
          activeTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab as CyclewiseTab)}
          networkSmeCount={smes.length}
          onStartOnboarding={() => setShowOnboardingModal(true)}
        />

        {/* Desktop sidebar toggle */}
        <div className="hidden md:flex items-center gap-2 bg-background px-4 py-2 border-b">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-(--color-leaf-green)" />
            <span>Every trade needs approval from everyone involved. No loans, ever.</span>
          </div>
        </div>

        {/* Tab Content Container */}
        <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-5 flex-1">
          {/* HOME: describe a need/offer, see matches immediately */}
          {currentTab === 'home' && (
            <div className="space-y-5">
              <TellCyclewiseSection
                onOrchestrationComplete={(newCycles) => {
                  setCycles(newCycles);
                  if (newCycles.length > 0) {
                    setSelectedCycleId(newCycles[0].id);
                  }
                }}
              />

              {substituteMessage && (
                <Alert>
                  <AlertDescription>{substituteMessage}</AlertDescription>
                </Alert>
              )}

              {cycles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold">
                      {cycles.length > 1 ? `${cycles.length} matches found` : 'Your match'}
                    </h3>
                    {cycles.length > 1 && (
                      <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg border">
                        {cycles.map((c, i) => (
                          <Button
                            key={c.id}
                            size="sm"
                            variant={activeSummaryCycle?.id === c.id ? 'default' : 'ghost'}
                            onClick={() => setSelectedCycleId(c.id)}
                          >
                            Match {i + 1}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  {activeSummaryCycle && (
                    <>
                      <ValueUnlockedSummaryCard
                        cycle={activeSummaryCycle}
                        smes={smesMap}
                        onCommit={handleCommitCycle}
                      />
                      <CycleCard
                        cycle={activeSummaryCycle}
                        smes={smesMap}
                        onCommit={handleCommitCycle}
                        onDecline={handleDeclineCycle}
                        onAskAgent={(c) => {
                          setInquiryCycle(c);
                          setShowInquiryModal(true);
                        }}
                        onRequestSubstitute={handleRequestSubstitute}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MY EXCHANGES */}
          {currentTab === 'exchanges' && (
            <ExchangesTracker
              cycles={cycles}
              smes={smesMap}
              onCommitAll={handleCommitCycle}
              onSimulateDecline={handleDeclineCycle}
              onReset={handleResetDemo}
            />
          )}

          {/* NETWORK: directory + trust record, together */}
          {currentTab === 'network' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Businesses in the network</span>
                      <Users className="size-4" />
                    </div>
                    <span className="text-xl font-bold block mt-1">{smes.length}</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Human Approval</span>
                      <ShieldCheck className="size-4 text-(--color-leaf-green)" />
                    </div>
                    <span className="text-xl font-bold block mt-1 text-(--color-leaf-green)">100%</span>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent>
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b">
                    <h3 className="text-sm font-bold">Businesses You Can Trade With</h3>
                    <Button size="sm" onClick={() => setShowOnboardingModal(true)}>
                      <Store data-icon="inline-start" />
                      Add Your Business
                    </Button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {smes.map((sme) => (
                      <Card key={sme.id} size="sm" className="bg-muted/40">
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{sme.name}</span>
                            <Badge variant="outline" className="text-[10px]">{sme.sector}</Badge>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="bg-background p-2 rounded-md border">
                              <span className="text-[10px] uppercase font-bold text-(--color-leaf-green) block">Offers:</span>
                              <span className="font-medium">{sme.offer_summary}</span>
                            </div>
                            <div className="bg-background p-2 rounded-md border">
                              <span className="text-[10px] uppercase font-bold text-(--color-burnt-orange) block">Needs:</span>
                              <span className="font-medium">{sme.need_summary}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                            <span>{sme.location}</span>
                            <span className={sme.identity_status === 'verified' ? 'text-(--color-leaf-green) font-semibold' : ''}>
                              {sme.identity_status === 'verified' ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <EvidencePanel smes={smes} />
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation (Visible < md screens) */}
        <BottomNav currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab as CyclewiseTab)} />
      </SidebarInset>

      {/* Grounded Agent Inquiry Q&A Modal */}
      <AgentInquiryModal
        isOpen={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
        cycle={inquiryCycle || activeSummaryCycle}
        smes={smesMap}
      />

      {/* SME Onboarding Wizard Modal */}
      <SmeOnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        engine={engine}
        onComplete={handleOnboardingComplete}
      />
    </SidebarProvider>
  );
}
