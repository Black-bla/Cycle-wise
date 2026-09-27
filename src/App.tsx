import React, { useState, useEffect, useMemo } from 'react';
import { MobileHeader } from './components/MobileHeader';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { GraphTestPanel } from './components/GraphTestPanel';
import { TellCyclewiseSection } from './components/TellCyclewiseSection';
import { CycleCard } from './components/CycleCard';
import { ValueUnlockedSummaryCard } from './components/ValueUnlockedSummaryCard';
import { EvidencePanel } from './components/EvidencePanel';
import { ExchangesTracker } from './components/ExchangesTracker';
import { HackathonRubricModal } from './components/HackathonRubricModal';
import { AgentCommandCenterModal } from './components/AgentCommandCenterModal';
import { AgentInquiryModal } from './components/AgentInquiryModal';
import { SmeOnboardingModal } from './components/SmeOnboardingModal';
import { DeterministicGraphEngine, GraphSearchResult } from './engine/graphEngine';
import { SEEDED_SMES } from './engine/fixtures';
import { ExchangeCycle, SMEProfile } from './agent/types';
import { Sparkles, Award, ShieldCheck, ArrowRight, CheckCircle2, TrendingUp, Layers, Users, Bot, Cpu, MessageSquare, RefreshCw, Store } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'network' | 'request' | 'matches' | 'exchanges' | 'profile'>('network');
  const [showRubricModal, setShowRubricModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [inquiryCycle, setInquiryCycle] = useState<ExchangeCycle | null>(null);

  // Initialize engine & state
  const engine = useMemo(() => new DeterministicGraphEngine(), []);
  const [smes, setSmes] = useState<SMEProfile[]>(SEEDED_SMES);
  const smesMap = useMemo(() => {
    const map = new Map<string, SMEProfile>();
    smes.forEach((s) => map.set(s.id, s));
    return map;
  }, [smes]);

  const [graphResult, setGraphResult] = useState<GraphSearchResult | null>(null);
  const [cycles, setCycles] = useState<ExchangeCycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

  const activeSummaryCycle = useMemo(() => {
    if (cycles.length === 0) return null;
    return cycles.find((c) => c.id === selectedCycleId) || cycles[0];
  }, [cycles, selectedCycleId]);

  // Load initial graph cycles
  useEffect(() => {
    engine.findCycles(4).then((res) => {
      setGraphResult(res);
      setCycles(res.cycles);
    });
  }, [engine]);

  const handleSearchResult = (res: GraphSearchResult) => {
    setGraphResult(res);
    setCycles(res.cycles);
  };

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
        c.id === cycleId ? { ...c, status: 'Failed' as const, risk_flags: ['Participant declined; substitute search recommended'] } : c
      )
    );
    setCurrentTab('exchanges');
  };

  const handleResetDemo = () => {
    engine.resetFixture();
    setSmes(SEEDED_SMES);
    engine.findCycles(4).then((res) => {
      setGraphResult(res);
      setCycles(res.cycles);
    });
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
    setCurrentTab('matches');
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#17202A] flex flex-col md:flex-row antialiased">
      {/* Desktop Sidebar (240px) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab as typeof currentTab)}
        onResetDemo={handleResetDemo}
        onStartOnboarding={() => setShowOnboardingModal(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        <MobileHeader
          activeTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab as typeof currentTab)}
          networkSmeCount={smes.length}
          onStartOnboarding={() => setShowOnboardingModal(true)}
        />

        {/* Hackathon Rubric & Compliance Callout Bar */}
        <div className="bg-[#131D2F] text-white px-4 py-2 border-b border-[#253654]">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#2E8B68]"></span>
              <span className="font-semibold text-[#E7B84B]">Milestone M0 Architecture Scaffold:</span>
              <span className="text-[#A6B2C3] hidden sm:inline">
                Mobile-first shell, real-time graph engine fixture, guardrails & OpenAPI contracts.
              </span>
            </div>

            <button
              onClick={() => setShowRubricModal(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#253752] hover:bg-[#324970] text-[#E7B84B] font-semibold text-[11px] transition-colors"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Inspect Rubric Compliance</span>
            </button>
          </div>
        </div>

        {/* AI Agent Live Quick-Action & Command Bar */}
        <div className="bg-white border-b border-[#E3E0D7] px-4 py-2.5 shadow-2xs">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-[#18243A] text-[#E7B84B] flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-[#E7B84B]" />
              </div>
              <div>
                <span className="font-bold text-[#18243A]">Google Gemini AI Agent:</span>
                <span className="text-[#68727D] ml-1.5 hidden sm:inline">
                  Multilingual Orchestration, Graph Bounded DFS & Grounded Explanations
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAgentModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#18243A] hover:bg-[#253752] text-[#E7B84B] font-semibold text-xs flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Agent Command Center</span>
              </button>
              <button
                onClick={() => {
                  setInquiryCycle(activeSummaryCycle);
                  setShowInquiryModal(true);
                }}
                className="px-3 py-1.5 rounded-lg border border-[#E3E0D7] bg-[#F7F5EF] hover:bg-[#EBE7DC] text-[#18243A] font-medium text-xs flex items-center space-x-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#2E8B68]" />
                <span>Ask Agent Q&A</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content Container */}
        <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 flex-1">
          {/* TAB 1: NETWORK OVERVIEW */}
          {currentTab === 'network' && (
            <div className="space-y-6">
              {/* Hero Banner with Value Proposition */}
              <div className="bg-gradient-to-r from-[#18243A] to-[#233554] rounded-2xl p-5 sm:p-7 text-white shadow-md">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-[#E7B84B]/20 text-[#E7B84B] text-xs font-semibold mb-3 border border-[#E7B84B]/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>No Expensive Cash Loans Required</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
                    Turn What Your SME Has Into What Another Business Needs.
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-[#C2CEDA] leading-relaxed">
                    Cyclewise coordinates multi-business resource loops in Nairobi. When Amina has cooking oil, GreenPack has packaging, SwiftMove has courier delivery, and LedgerPro needs bookkeeping, Cyclewise connects all four into one transparent rescue cycle.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowOnboardingModal(true)}
                      className="px-4 py-2.5 rounded-lg bg-[#E7B84B] hover:bg-[#D4A538] text-[#18243A] font-bold text-xs sm:text-sm transition-all flex items-center space-x-2 shadow-xs"
                    >
                      <Store className="w-4 h-4" />
                      <span>Onboard Your SME</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentTab('request')}
                      className="px-4 py-2.5 rounded-lg bg-[#253752] hover:bg-[#324970] text-white font-semibold text-xs sm:text-sm transition-colors border border-[#3A4E70] flex items-center space-x-1.5"
                    >
                      <span>Tell Cyclewise Need</span>
                    </button>
                    <button
                      onClick={() => setCurrentTab('matches')}
                      className="px-4 py-2.5 rounded-lg bg-transparent hover:bg-white/10 text-[#C2CEDA] hover:text-white font-medium text-xs sm:text-sm transition-colors border border-[#3A4E70]"
                    >
                      View Rescue Loops ({cycles.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Network Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <button
                  onClick={() => setCurrentTab('matches')}
                  className="bg-white p-4 rounded-xl border border-[#E3E0D7] shadow-xs text-left hover:border-[#18243A] hover:shadow-sm transition-all group focus-visible:outline-hidden"
                >
                  <div className="flex items-center justify-between text-xs text-[#68727D]">
                    <span className="group-hover:text-[#18243A] font-medium">Value Unlocked</span>
                    <TrendingUp className="w-4 h-4 text-[#2E8B68]" />
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-[#18243A] block mt-1">KES 72,000</span>
                  <span className="text-[10px] text-[#2E8B68] font-medium block mt-0.5">View Economic Breakdown &rarr;</span>
                </button>

                <div className="bg-white p-4 rounded-xl border border-[#E3E0D7] shadow-xs">
                  <div className="flex items-center justify-between text-xs text-[#68727D]">
                    <span>Active SMEs</span>
                    <Users className="w-4 h-4 text-[#18243A]" />
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-[#18243A] block mt-1">6 Businesses</span>
                  <span className="text-[10px] text-[#68727D] block mt-0.5">Nairobi County network</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E3E0D7] shadow-xs">
                  <div className="flex items-center justify-between text-xs text-[#68727D]">
                    <span>Feasible Edges</span>
                    <Layers className="w-4 h-4 text-[#E7B84B]" />
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-[#18243A] block mt-1">6 Compatible</span>
                  <span className="text-[10px] text-[#68727D] block mt-0.5">Direct & multi-step</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E3E0D7] shadow-xs">
                  <div className="flex items-center justify-between text-xs text-[#68727D]">
                    <span>Human Approval</span>
                    <ShieldCheck className="w-4 h-4 text-[#2E8B68]" />
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-[#2E8B68] block mt-1">100% Gated</span>
                  <span className="text-[10px] text-[#68727D] block mt-0.5">Zero auto-contracts</span>
                </div>
              </div>

              {/* Seeded SMEs Directory with Needs & Offers */}
              <div className="bg-white rounded-xl border border-[#E3E0D7] p-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EFECE4]">
                  <div>
                    <h3 className="text-sm font-bold text-[#18243A]">Active Nairobi SME Directory</h3>
                    <p className="text-xs text-[#68727D]">Real synthetic business profiles in the verified network ({smes.length} total)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowOnboardingModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-[#18243A] hover:bg-[#253752] text-[#E7B84B] font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-xs"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Onboard New SME</span>
                    </button>
                    <span className="text-xs text-[#2E8B68] font-semibold bg-[#EAF5F0] px-2.5 py-1 rounded-full">
                      {smes.length} Verified Nodes
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {smes.map((sme) => (
                    <div key={sme.id} className="p-3.5 rounded-lg border border-[#E3E0D7] bg-[#F7F5EF] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#18243A]">{sme.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[#E3E0D7] text-[#68727D]">
                          {sme.sector}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="bg-white p-2 rounded-md border border-[#EBE7DC]">
                          <span className="text-[10px] uppercase font-bold text-[#2E8B68] block">Offers:</span>
                          <span className="text-[#18243A] font-medium">{sme.offer_summary}</span>
                        </div>
                        <div className="bg-white p-2 rounded-md border border-[#EBE7DC]">
                          <span className="text-[10px] uppercase font-bold text-[#D8783D] block">Needs:</span>
                          <span className="text-[#18243A] font-medium">{sme.need_summary}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-[#68727D]">
                        <span>{sme.location}</span>
                        <span className="text-[#2E8B68] font-semibold">
                          {sme.trust_events.length} Trust Events
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TELL CYCLEWISE (REQUEST CREATION) */}
          {currentTab === 'request' && (
            <div>
              <TellCyclewiseSection
                onFindMatches={() => setCurrentTab('matches')}
                onOrchestrationComplete={(newCycles) => {
                  setCycles(newCycles);
                  if (newCycles.length > 0) {
                    setSelectedCycleId(newCycles[0].id);
                  }
                  setCurrentTab('matches');
                }}
              />
            </div>
          )}

          {/* TAB 3: MATCHES & REAL-TIME GRAPH OBSERVABILITY */}
          {currentTab === 'matches' && (
            <div className="space-y-6">
              <GraphTestPanel
                engine={engine}
                smes={smesMap}
                onSearchResult={handleSearchResult}
              />

              {/* Economic Impact Summary Card for the Matched Loop */}
              {activeSummaryCycle && (
                <div>
                  <ValueUnlockedSummaryCard
                    cycle={activeSummaryCycle}
                    smes={smesMap}
                    onCommit={handleCommitCycle}
                  />
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#18243A]">
                      Discovered Exchange Cycles ({cycles.length})
                    </h3>
                    <p className="text-xs text-[#68727D]">
                      Select a cycle below to inspect its individual economic breakdown
                    </p>
                  </div>

                  {cycles.length > 1 && (
                    <div className="flex items-center gap-1 p-0.5 bg-[#F7F5EF] rounded-lg border border-[#E3E0D7]">
                      {cycles.map((c, i) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCycleId(c.id)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                            activeSummaryCycle?.id === c.id
                              ? 'bg-[#18243A] text-[#E7B84B] shadow-xs'
                              : 'text-[#68727D] hover:text-[#18243A]'
                          }`}
                        >
                          {c.cycle_length}-Way Cycle {i === 0 ? '(Rescue)' : '(Direct)'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {cycles.length > 0 ? (
                  <div className="space-y-4">
                    {cycles.map((cycle) => (
                      <div
                        key={cycle.id}
                        onClick={() => setSelectedCycleId(cycle.id)}
                        className={`transition-all rounded-xl ${
                          activeSummaryCycle?.id === cycle.id
                            ? 'ring-2 ring-[#18243A] ring-offset-2'
                            : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        <CycleCard
                          cycle={cycle}
                          smes={smesMap}
                          onCommit={handleCommitCycle}
                          onDecline={handleDeclineCycle}
                          onAskAgent={(c) => {
                            setInquiryCycle(c);
                            setShowInquiryModal(true);
                          }}
                          onRequestSubstitute={(cycleId) => {
                            const c = cycles.find((x) => x.id === cycleId) || null;
                            setInquiryCycle(c);
                            setShowAgentModal(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white rounded-xl border border-[#E3E0D7] shadow-xs">
                    <p className="text-sm font-semibold text-[#18243A]">No cycles found matching the current configuration.</p>
                    <p className="text-xs text-[#68727D] mt-1">
                      Check if an edge was disabled in the test panel above or click &quot;Reset Fixture&quot; to restore the full network.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EXCHANGES TRACKER */}
          {currentTab === 'exchanges' && (
            <div>
              <ExchangesTracker
                cycles={cycles}
                smes={smesMap}
                onCommitAll={handleCommitCycle}
                onSimulateDecline={handleDeclineCycle}
                onReset={handleResetDemo}
              />
            </div>
          )}

          {/* TAB 5: TRUST EVIDENCE PROFILE */}
          {currentTab === 'profile' && (
            <div>
              <EvidencePanel smes={smes} />
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation (Visible < md screens) */}
        <BottomNav currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab as typeof currentTab)} />
      </div>

      {/* AI Agent Command Center Modal */}
      <AgentCommandCenterModal
        isOpen={showAgentModal}
        onClose={() => setShowAgentModal(false)}
        smes={smesMap}
        activeCycle={activeSummaryCycle}
        onCycleUpdate={(newCycles) => {
          setCycles(newCycles);
          if (newCycles.length > 0) {
            setSelectedCycleId(newCycles[0].id);
          }
        }}
      />

      {/* Grounded Agent Inquiry Q&A Modal */}
      <AgentInquiryModal
        isOpen={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
        cycle={inquiryCycle || activeSummaryCycle}
        smes={smesMap}
      />

      {/* Hackathon Rubric Modal */}
      <HackathonRubricModal isOpen={showRubricModal} onClose={() => setShowRubricModal(false)} />

      {/* SME Onboarding Wizard Modal */}
      <SmeOnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        engine={engine}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}
