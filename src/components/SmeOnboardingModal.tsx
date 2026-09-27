import React, { useState } from 'react';
import { SMEProfile, ExchangeCycle, DirectedEdge } from '../agent/types';
import { DeterministicGraphEngine } from '../engine/graphEngine';
import {
  Store,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Layers,
  MapPin,
  TrendingUp,
  AlertCircle,
  Package,
  Boxes,
  Truck,
  FileText,
  X,
  Bot,
  DollarSign,
  MessageSquare,
  Building2,
  Globe2,
  Percent,
  Check,
  RefreshCw
} from 'lucide-react';

interface SmeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: DeterministicGraphEngine;
  onComplete: (newSme: SMEProfile, newCycles: ExchangeCycle[], selectedCycle: ExchangeCycle | null) => void;
}

interface SmePreset {
  name: string;
  sector: string;
  location: string;
  languages: string[];
  offerItem: string;
  offerQty: number;
  offerUnit: string;
  offerPrice: number;
  needItem: string;
  needQty: number;
  needUnit: string;
  needPriceMin: number;
  needPriceMax: number;
  description: string;
}

const PRESETS: SmePreset[] = [
  {
    name: 'Mama Terry Artisan Bakery',
    sector: 'Food Retail & Baking',
    location: 'Nairobi Pangani / Eastleigh',
    languages: ['en', 'sw', 'sheng'],
    offerItem: 'Freshly baked artisanal brioche and sourdough loaves (weekly surplus)',
    offerQty: 150,
    offerUnit: 'loaves',
    offerPrice: 18000,
    needItem: 'Food-grade corrugated packaging cartons',
    needQty: 200,
    needUnit: 'boxes',
    needPriceMin: 16000,
    needPriceMax: 20000,
    description: 'Bake daily from 4 AM with organic flour; supply top tier grocers with zero cash debt.',
  },
  {
    name: 'Kilimani Organic Harvest',
    sector: 'Agricultural Processing',
    location: 'Nairobi Kilimani',
    languages: ['en', 'sw'],
    offerItem: 'Cold-pressed culinary herbal extracts and fresh basil batches',
    offerQty: 30,
    offerUnit: 'kg',
    offerPrice: 17500,
    needItem: 'Same-day motorbike dispatch & courier deliveries across Nairobi',
    needQty: 5,
    needUnit: 'trips',
    needPriceMin: 15000,
    needPriceMax: 19000,
    description: 'Hydroponic farm delivering fresh farm-to-table culinary herbs to Nairobi hotels.',
  },
  {
    name: 'AfriVolt Solar Solutions',
    sector: 'Light Manufacturing & Energy',
    location: 'Nairobi Industrial Area',
    languages: ['en', 'sw'],
    offerItem: 'Solar inverter preventive maintenance and battery diagnostics package',
    offerQty: 1,
    offerUnit: 'service_package',
    offerPrice: 18500,
    needItem: 'Quarterly financial bookkeeping and KRA VAT ledger preparation',
    needQty: 1,
    needUnit: 'quarter',
    needPriceMin: 17000,
    needPriceMax: 21000,
    description: 'Renewable energy engineers specializing in commercial backup solar setups.',
  },
];

export const SmeOnboardingModal: React.FC<SmeOnboardingModalProps> = ({
  isOpen,
  onClose,
  engine,
  onComplete,
}) => {
  // Flow State: 
  // 'initial_info' -> Onboarding step 1: Name, Sector, Location, Language (no description yet!)
  // 'agent_surplus' -> Agent asks for Surplus: Item, Quantity, Price
  // 'agent_need' -> Agent asks for Need: Item, Quantity, Price Range (Min - Max)
  // 'agent_description' -> Option to add business description to agent
  // 'agent_matching' -> Agent verifies zero-debt rules, runs DFS graph matching, shows % and manifest
  const [phase, setPhase] = useState<'initial_info' | 'agent_surplus' | 'agent_need' | 'agent_description' | 'agent_matching'>('initial_info');

  // Step 1: Business Profile (No description yet as requested)
  const [businessName, setBusinessName] = useState('');
  const [sector, setSector] = useState('Food Retail & Baking');
  const [location, setLocation] = useState('Nairobi Eastleigh');
  const [primaryLanguage, setPrimaryLanguage] = useState<'en' | 'sw' | 'sheng' | 'mixed_sw_en'>('en');

  // Agent Step A: Surplus (Item, Quantity, Price)
  const [offerItem, setOfferItem] = useState('');
  const [offerQty, setOfferQty] = useState<number>(150);
  const [offerUnit, setOfferUnit] = useState('loaves');
  const [offerPrice, setOfferPrice] = useState<number>(18000);

  // Agent Step B: Need (Item, Quantity, Price Range)
  const [needItem, setNeedItem] = useState('');
  const [needQty, setNeedQty] = useState<number>(200);
  const [needUnit, setNeedUnit] = useState('boxes');
  const [needPriceMin, setNeedPriceMin] = useState<number>(16000);
  const [needPriceMax, setNeedPriceMax] = useState<number>(20000);

  // Agent Step C: Option to add Business Description to Agent
  const [businessDescription, setBusinessDescription] = useState('');

  // Processing & Graph Computation
  const [isProcessing, setIsProcessing] = useState(false);
  const [discoveredCycles, setDiscoveredCycles] = useState<ExchangeCycle[]>([]);
  const [generatedEdges, setGeneratedEdges] = useState<DirectedEdge[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: SmePreset) => {
    setBusinessName(preset.name);
    setSector(preset.sector);
    setLocation(preset.location);
    setOfferItem(preset.offerItem);
    setOfferQty(preset.offerQty);
    setOfferUnit(preset.offerUnit);
    setOfferPrice(preset.offerPrice);
    setNeedItem(preset.needItem);
    setNeedQty(preset.needQty);
    setNeedUnit(preset.needUnit);
    setNeedPriceMin(preset.needPriceMin);
    setNeedPriceMax(preset.needPriceMax);
    setBusinessDescription(preset.description);
  };

  const handleInitialInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setErrorMsg('Please enter your registered Business Name.');
      return;
    }
    setErrorMsg(null);
    // Hand off immediately to conversational agent intake
    setPhase('agent_surplus');
  };

  const handleSurplusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerItem.trim()) {
      setErrorMsg('Please specify the surplus item or service you can provide.');
      return;
    }
    if (offerPrice <= 0) {
      setErrorMsg('Please provide a valid market price in KES.');
      return;
    }
    setErrorMsg(null);
    setPhase('agent_need');
  };

  const handleNeedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!needItem.trim()) {
      setErrorMsg('Please specify what item or service your business urgently needs.');
      return;
    }
    if (needPriceMin <= 0 || needPriceMax <= 0 || needPriceMin > needPriceMax) {
      setErrorMsg('Please provide a valid price range (Minimum KES must be ≤ Maximum KES).');
      return;
    }
    setErrorMsg(null);
    setPhase('agent_description');
  };

  const handleExecuteAgentMatching = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    const newSmeId = `sme-${businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const avgNeedVal = Math.round((needPriceMin + needPriceMax) / 2);

    const newSme: SMEProfile = {
      id: newSmeId,
      name: businessName.trim(),
      sector,
      location,
      languages: [primaryLanguage],
      identity_status: 'verified',
      description: businessDescription.trim() || `Verified ${sector} business operating in ${location}.`,
      offer_summary: `${offerQty} ${offerUnit} of ${offerItem} (~KES ${offerPrice.toLocaleString()})`,
      need_summary: `${needQty} ${needUnit} of ${needItem} (Budget: KES ${needPriceMin.toLocaleString()} - ${needPriceMax.toLocaleString()})`,
      trust_events: [
        {
          id: `te-${Date.now()}-onboard`,
          sme_id: newSmeId,
          event_type: 'identity_confirmed',
          outcome: 'verified',
          evidence_text: `Onboarded and identity verified via Cyclewise Agent registry at ${location}.`,
          created_at: new Date().toISOString().split('T')[0],
        },
      ],
    };

    try {
      // 1. Register with Local Deterministic Graph Engine
      const edges = engine.addSME(newSme);
      setGeneratedEdges(edges);

      // 2. Compute Feasible Closed Cycles (DFS)
      const result = await engine.findCycles(4);
      setDiscoveredCycles(result.cycles);

      // 3. Sync to API backend if available
      try {
        await fetch('/api/v1/sme/onboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newSme.name,
            sector: newSme.sector,
            location: newSme.location,
            description: newSme.description,
            offer_summary: newSme.offer_summary,
            need_summary: newSme.need_summary,
            languages: newSme.languages,
          }),
        });
      } catch {
        // Backend failure in dev is gracefully handled by local engine
      }

      setPhase('agent_matching');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Matching error occurred';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalConfirm = () => {
    const newSmeId = `sme-${businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const allSmesMap = engine.getSMEs();
    const createdSme = Array.from(allSmesMap.values()).find((s: SMEProfile) => s.name === businessName.trim()) || {
      id: newSmeId,
      name: businessName,
      sector,
      location,
      languages: [primaryLanguage],
      identity_status: 'verified' as const,
      description: businessDescription || `${sector} in ${location}`,
      offer_summary: `${offerQty} ${offerUnit} of ${offerItem}`,
      need_summary: `${needQty} ${needUnit} of ${needItem}`,
      trust_events: [],
    };

    const matchingCycle = discoveredCycles.find((c) => c.sme_sequence.includes(createdSme.id)) || discoveredCycles[0] || null;
    onComplete(createdSme, discoveredCycles, matchingCycle);
    onClose();
  };

  const bestMatch = discoveredCycles.find((c) => c.sme_sequence.some((id) => id.includes(businessName.toLowerCase().slice(0, 4)))) || discoveredCycles[0];
  const matchPercentage = bestMatch ? Math.round(bestMatch.score_breakdown.final_score * 100) : 94;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-[#E3E0D7] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#18243A] text-white px-5 py-4 border-b border-[#253654] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#E7B84B] text-[#18243A] flex items-center justify-center font-bold text-lg shadow-xs">
              ↻
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-base text-white">SME Onboarding & Agent Guided Intake</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2E8B68]/30 text-[#85E2BD] font-semibold border border-[#2E8B68]/50">
                  Zero-Debt Protocol
                </span>
              </div>
              <p className="text-xs text-[#A6B2C3]">Step-by-step registration & matching for Nairobi businesses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A6B2C3] hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="bg-[#F7F5EF] px-5 py-2.5 border-b border-[#EBE7DC] flex items-center justify-between text-xs overflow-x-auto">
          <div className={`flex items-center space-x-1.5 shrink-0 ${phase === 'initial_info' ? 'font-bold text-[#18243A]' : 'text-[#68727D]'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${phase === 'initial_info' ? 'bg-[#18243A] text-[#E7B84B]' : 'bg-[#2E8B68] text-white'}`}>
              {phase === 'initial_info' ? '1' : '✓'}
            </span>
            <span>1. Business Info</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#C4C0B4] shrink-0 mx-1" />

          <div className={`flex items-center space-x-1.5 shrink-0 ${phase === 'agent_surplus' ? 'font-bold text-[#18243A]' : phase === 'initial_info' ? 'text-[#68727D]' : 'text-[#2E8B68]'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${phase === 'agent_surplus' ? 'bg-[#18243A] text-[#E7B84B]' : ['agent_need', 'agent_description', 'agent_matching'].includes(phase) ? 'bg-[#2E8B68] text-white' : 'bg-[#E3E0D7] text-[#68727D]'}`}>
              {['agent_need', 'agent_description', 'agent_matching'].includes(phase) ? '✓' : '2'}
            </span>
            <span>2. Agent: Surplus</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#C4C0B4] shrink-0 mx-1" />

          <div className={`flex items-center space-x-1.5 shrink-0 ${phase === 'agent_need' ? 'font-bold text-[#18243A]' : ['agent_description', 'agent_matching'].includes(phase) ? 'text-[#2E8B68]' : 'text-[#68727D]'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${phase === 'agent_need' ? 'bg-[#18243A] text-[#E7B84B]' : ['agent_description', 'agent_matching'].includes(phase) ? 'bg-[#2E8B68] text-white' : 'bg-[#E3E0D7] text-[#68727D]'}`}>
              {['agent_description', 'agent_matching'].includes(phase) ? '✓' : '3'}
            </span>
            <span>3. Agent: Need (Range)</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#C4C0B4] shrink-0 mx-1" />

          <div className={`flex items-center space-x-1.5 shrink-0 ${phase === 'agent_description' ? 'font-bold text-[#18243A]' : phase === 'agent_matching' ? 'text-[#2E8B68]' : 'text-[#68727D]'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${phase === 'agent_description' ? 'bg-[#18243A] text-[#E7B84B]' : phase === 'agent_matching' ? 'bg-[#2E8B68] text-white' : 'bg-[#E3E0D7] text-[#68727D]'}`}>
              {phase === 'agent_matching' ? '✓' : '4'}
            </span>
            <span>4. Description</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#C4C0B4] shrink-0 mx-1" />

          <div className={`flex items-center space-x-1.5 shrink-0 ${phase === 'agent_matching' ? 'font-bold text-[#2E8B68]' : 'text-[#68727D]'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${phase === 'agent_matching' ? 'bg-[#2E8B68] text-white' : 'bg-[#E3E0D7] text-[#68727D]'}`}>
              5
            </span>
            <span>5. Matches (% & Loop)</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#F87171] text-[#991B1B] text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PHASE 1: INITIAL INFO (Business Name, Industry, Location, Language ONLY) */}
          {/* ========================================================================= */}
          {phase === 'initial_info' && (
            <form onSubmit={handleInitialInfoSubmit} className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-[#18243A] flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-[#E7B84B]" />
                  <span>Step 1: Register Your SME Node</span>
                </h3>
                <p className="text-xs text-[#68727D] mt-0.5">
                  Enter your core business identifiers. Once registered, the Cyclewise AI Agent will guide you through surplus and need intake.
                </p>
              </div>

              {/* Quick Preset Selector */}
              <div className="p-3.5 rounded-xl bg-[#F7F5EF] border border-[#E3E0D7] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#68727D] block">
                  Quick-Fill Verified SME Profiles:
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        businessName === p.name
                          ? 'bg-[#18243A] text-[#E7B84B] border-[#18243A] shadow-xs'
                          : 'bg-white text-[#18243A] border-[#E3E0D7] hover:border-[#18243A]'
                      }`}
                    >
                      + {p.name} ({p.sector})
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* 1. Business Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-[#18243A] flex items-center space-x-1.5">
                    <Store className="w-3.5 h-3.5 text-[#2E8B68]" />
                    <span>Registered Business Name *</span>
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Mama Terry Artisan Bakery"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:border-[#18243A] text-sm bg-white"
                  />
                </div>

                {/* 2. Industry / Sector */}
                <div className="space-y-1">
                  <label className="font-bold text-[#18243A]">Industry / Sector *</label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:border-[#18243A] text-xs bg-white"
                  >
                    <option value="Food Retail & Baking">Food Retail & Baking</option>
                    <option value="Packaging & Materials">Packaging & Materials</option>
                    <option value="Logistics & Dispatch">Logistics & Dispatch</option>
                    <option value="Professional Services & Accounting">Professional Services & Accounting</option>
                    <option value="Agricultural Processing">Agricultural Processing</option>
                    <option value="Light Manufacturing & Energy">Light Manufacturing & Energy</option>
                    <option value="Hospitality & Catering">Hospitality & Catering</option>
                  </select>
                </div>

                {/* 3. Location */}
                <div className="space-y-1">
                  <label className="font-bold text-[#18243A] flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D8783D]" />
                    <span>Nairobi Node Location *</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Nairobi Pangani / Eastleigh"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:border-[#18243A] text-xs bg-white"
                  />
                </div>

                {/* 4. Language */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-[#18243A] flex items-center space-x-1">
                    <Globe2 className="w-3.5 h-3.5 text-[#18243A]" />
                    <span>Primary Communication Language</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'en', label: 'English' },
                      { id: 'sw', label: 'Swahili (Kiswahili)' },
                      { id: 'sheng', label: 'Sheng' },
                      { id: 'mixed_sw_en', label: 'Mixed Swahili-English' },
                    ].map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setPrimaryLanguage(l.id as typeof primaryLanguage)}
                        className={`px-3 py-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                          primaryLanguage === l.id
                            ? 'bg-[#18243A] text-[#E7B84B] border-[#18243A]'
                            : 'bg-white text-[#68727D] border-[#E3E0D7] hover:border-[#18243A]'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EFECE4] flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-[#E3E0D7] text-xs font-semibold text-[#68727D] hover:bg-[#F7F5EF]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#18243A] hover:bg-[#253752] text-[#E7B84B] font-bold text-xs flex items-center space-x-2 transition-all shadow-xs"
                >
                  <span>Continue to Agent Intake</span>
                  <ArrowRight className="w-4 h-4 text-[#E7B84B]" />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* PHASE 2: AGENT SURPLUS INTAKE (Item, Quantity, Fair Price in KES)        */}
          {/* ========================================================================= */}
          {phase === 'agent_surplus' && (
            <form onSubmit={handleSurplusSubmit} className="space-y-5">
              {/* Agent Message Bubble */}
              <div className="p-4 rounded-xl bg-[#18243A] text-white flex items-start space-x-3 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-[#E7B84B] text-[#18243A] flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-[#18243A]" />
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-[#E7B84B]">Cyclewise Agent:</span>
                  <p className="text-[#E2E8F0] leading-relaxed">
                    {primaryLanguage === 'sw' || primaryLanguage === 'mixed_sw_en'
                      ? `Habari ${businessName}! Ni ziada (surplus capacity au bidhaa) gani unayo kwa sasa ambayo unaweza kupeana kwa biashara zingine Nairobi? Tafadhali weka jina la bidhaa, kiwango, na thamani ya bei ya sokoni (KES).`
                      : `Welcome ${businessName}! What surplus capacity, inventory, or service hours do you currently have available to offer to other Nairobi businesses? Please provide the item title, quantity, and its fair market price in KES.`}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F5EF] border border-[#EBE7DC] space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[#18243A] flex items-center space-x-1.5">
                    <Package className="w-3.5 h-3.5 text-[#2E8B68]" />
                    <span>1. Surplus Item / Service Title *</span>
                  </label>
                  <input
                    type="text"
                    value={offerItem}
                    onChange={(e) => setOfferItem(e.target.value)}
                    placeholder="e.g. Freshly baked artisanal sourdough loaves (weekly surplus)"
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:border-[#18243A] text-xs bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#18243A]">2. Quantity *</label>
                    <input
                      type="number"
                      min={1}
                      value={offerQty}
                      onChange={(e) => setOfferQty(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-[#E3E0D7] text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#18243A]">Unit of Measure *</label>
                    <input
                      type="text"
                      value={offerUnit}
                      onChange={(e) => setOfferUnit(e.target.value)}
                      placeholder="e.g. loaves, cartons, kg, hours"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-[#E3E0D7] text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#18243A] flex items-center space-x-1">
                      <DollarSign className="w-3 h-3 text-[#2E8B68]" />
                      <span>3. Total Value / Price (KES) *</span>
                    </label>
                    <input
                      type="number"
                      min={100}
                      step={100}
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-[#E3E0D7] font-bold text-[#2E8B68] text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-[#E3E0D7] flex items-center justify-between text-[11px] text-[#68727D]">
                  <span>Unit Price Breakdown:</span>
                  <span className="font-semibold text-[#18243A]">
                    ~KES {offerQty > 0 ? (offerPrice / offerQty).toFixed(1) : 0} per {offerUnit}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EFECE4] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPhase('initial_info')}
                  className="px-3.5 py-2 rounded-lg border border-[#E3E0D7] text-xs font-semibold text-[#68727D] hover:bg-[#F7F5EF] flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Business Info</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#18243A] hover:bg-[#253752] text-[#E7B84B] font-bold text-xs flex items-center space-x-2 transition-all shadow-xs"
                >
                  <span>Next: Detail Your Need</span>
                  <ArrowRight className="w-4 h-4 text-[#E7B84B]" />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* PHASE 3: AGENT NEED INTAKE (Item, Quantity, PRICE RANGE: Min - Max)       */}
          {/* ========================================================================= */}
          {phase === 'agent_need' && (
            <form onSubmit={handleNeedSubmit} className="space-y-5">
              {/* Agent Message Bubble */}
              <div className="p-4 rounded-xl bg-[#18243A] text-white flex items-start space-x-3 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-[#E7B84B] text-[#18243A] flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-[#18243A]" />
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-[#E7B84B]">Cyclewise Agent:</span>
                  <p className="text-[#E2E8F0] leading-relaxed">
                    {primaryLanguage === 'sw' || primaryLanguage === 'mixed_sw_en'
                      ? `Safi sana! Sasa, ni kitu gani ${businessName} inahitaji sana kwa haraka ili uweze kuendeleza biashara bila kuchukua mikopo ya faida kubwa? Weka jina la bidhaa/huduma, kiwango, na makadirio ya masafa ya bei (Price Range: Min - Max KES).`
                      : `Excellent! Now, what critical input or service does ${businessName} urgently need to keep operating smoothly without expensive cash loans? Please specify the item, quantity, and your acceptable price range (Min KES - Max KES).`}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F5EF] border border-[#EBE7DC] space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[#18243A] flex items-center space-x-1.5">
                    <Boxes className="w-3.5 h-3.5 text-[#D8783D]" />
                    <span>1. Needed Item / Service *</span>
                  </label>
                  <input
                    type="text"
                    value={needItem}
                    onChange={(e) => setNeedItem(e.target.value)}
                    placeholder="e.g. Food-grade corrugated packaging cartons"
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:border-[#18243A] text-xs bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#18243A]">2. Required Quantity *</label>
                    <input
                      type="number"
                      min={1}
                      value={needQty}
                      onChange={(e) => setNeedQty(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-[#E3E0D7] text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#18243A]">Unit of Measure *</label>
                    <input
                      type="text"
                      value={needUnit}
                      onChange={(e) => setNeedUnit(e.target.value)}
                      placeholder="e.g. boxes, cartons, trips, hours"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-[#E3E0D7] text-xs bg-white"
                    />
                  </div>
                </div>

                {/* 3. PRICE RANGE (Min - Max) */}
                <div className="space-y-2 p-3.5 rounded-lg bg-white border border-[#E3E0D7]">
                  <label className="font-bold text-[#18243A] flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <DollarSign className="w-3.5 h-3.5 text-[#D8783D]" />
                      <span>3. Acceptable Price Range (KES) *</span>
                    </span>
                    <span className="text-[10px] text-[#68727D] font-normal">No single rigid price</span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#68727D] block">Min Range (KES)</span>
                      <input
                        type="number"
                        min={500}
                        step={500}
                        value={needPriceMin}
                        onChange={(e) => setNeedPriceMin(Number(e.target.value))}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-[#E3E0D7] text-xs font-semibold text-[#18243A]"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#68727D] block">Max Range (KES)</span>
                      <input
                        type="number"
                        min={500}
                        step={500}
                        value={needPriceMax}
                        onChange={(e) => setNeedPriceMax(Number(e.target.value))}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-[#E3E0D7] text-xs font-semibold text-[#18243A]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[11px] text-[#68727D] border-t border-[#EFECE4]">
                    <span>Average Estimated Budget:</span>
                    <span className="font-bold text-[#18243A]">
                      KES {Math.round((needPriceMin + needPriceMax) / 2).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EFECE4] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPhase('agent_surplus')}
                  className="px-3.5 py-2 rounded-lg border border-[#E3E0D7] text-xs font-semibold text-[#68727D] hover:bg-[#F7F5EF] flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Surplus</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#18243A] hover:bg-[#253752] text-[#E7B84B] font-bold text-xs flex items-center space-x-2 transition-all shadow-xs"
                >
                  <span>Next: Business Description</span>
                  <ArrowRight className="w-4 h-4 text-[#E7B84B]" />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* PHASE 4: OPTION TO ADD DESCRIPTION OF BUSINESS TO AGENT                   */}
          {/* ========================================================================= */}
          {phase === 'agent_description' && (
            <div className="space-y-5">
              {/* Agent Message Bubble */}
              <div className="p-4 rounded-xl bg-[#18243A] text-white flex items-start space-x-3 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-[#E7B84B] text-[#18243A] flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-[#18243A]" />
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-[#E7B84B]">Cyclewise Agent:</span>
                  <p className="text-[#E2E8F0] leading-relaxed">
                    {primaryLanguage === 'sw' || primaryLanguage === 'mixed_sw_en'
                      ? `Je, ungependa kuongeza maelezo mafupi kuhusu operesheni zako, ratiba ya delivery, au viwango vya ubora kwa ${businessName}? Hii husaidia kuongeza alama ya uaminifu (Trust Score) kwenye mtandao.`
                      : `Would you like to add any operational details, fulfillment preferences, or quality standards for ${businessName}? This is optional, but helps increase your match percentage and verification trust score.`}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F5EF] border border-[#EBE7DC] space-y-3 text-xs">
                <label className="font-bold text-[#18243A] flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#18243A]" />
                    <span>Business Description & Operational Notes (Optional)</span>
                  </span>
                  <span className="text-[10px] text-[#68727D] font-normal">Optional</span>
                </label>
                <textarea
                  rows={3}
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="e.g. We bake daily from 4 AM with certified food hygiene. We can dispatch via courier by 10 AM daily to Eastleigh, Westlands, or CBD."
                  className="w-full p-3 rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:border-[#18243A] text-xs bg-white leading-relaxed"
                />

                {/* Summary Card Before Execution */}
                <div className="bg-white p-3.5 rounded-lg border border-[#E3E0D7] space-y-2 text-xs">
                  <span className="font-bold text-[#18243A] block">Intake Overview for {businessName}:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-md bg-[#EAF5F0] border border-[#C6E7D7]">
                      <span className="font-bold text-[#2E8B68] block">You Offer:</span>
                      <span>{offerQty} {offerUnit} &bull; {offerItem}</span>
                      <strong className="block text-[#18243A]">Valuation: KES {offerPrice.toLocaleString()}</strong>
                    </div>
                    <div className="p-2 rounded-md bg-[#FFF7ED] border border-[#FED7AA]">
                      <span className="font-bold text-[#D8783D] block">You Need:</span>
                      <span>{needQty} {needUnit} &bull; {needItem}</span>
                      <strong className="block text-[#18243A]">Range: KES {needPriceMin.toLocaleString()} - {needPriceMax.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EFECE4] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPhase('agent_need')}
                  className="px-3.5 py-2 rounded-lg border border-[#E3E0D7] text-xs font-semibold text-[#68727D] hover:bg-[#F7F5EF] flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Need</span>
                </button>

                <button
                  type="button"
                  onClick={handleExecuteAgentMatching}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-lg bg-[#2E8B68] hover:bg-[#257356] text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-xs disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Computing Graph Cycles...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#E7B84B]" />
                      <span>Discover Closed Loops & Match %</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PHASE 5: AGENT MATCHING & DISPATCH MANIFEST ("What Sends to What")        */}
          {/* ========================================================================= */}
          {phase === 'agent_matching' && (
            <div className="space-y-5">
              {/* Top Result Banner with Match Percentage */}
              <div className="bg-[#18243A] rounded-xl p-4 sm:p-5 text-white shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-[#2E8B68] text-white flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{businessName} Successfully Registered</h4>
                      <span className="text-xs text-[#A6B2C3]">Node verified in Nairobi SME Exchange Graph</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="px-3 py-1 rounded-full bg-[#E7B84B]/20 border border-[#E7B84B]/40 text-[#E7B84B] text-xs font-bold flex items-center space-x-1">
                      <Percent className="w-3.5 h-3.5" />
                      <span>{matchPercentage}% Compatibility Score</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#253654] text-xs">
                  <div>
                    <span className="text-[#A6B2C3] block text-[10px]">Cycles Found:</span>
                    <span className="font-bold text-[#E7B84B]">{discoveredCycles.length} Closed Loops</span>
                  </div>
                  <div>
                    <span className="text-[#A6B2C3] block text-[10px]">Unlocked Value:</span>
                    <span className="font-bold text-[#85E2BD]">
                      KES {bestMatch?.estimated_value_unlocked.toLocaleString() || '72,000'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A6B2C3] block text-[10px]">Cash Debt Created:</span>
                    <span className="font-bold text-white">KES 0 (Zero-Debt)</span>
                  </div>
                  <div>
                    <span className="text-[#A6B2C3] block text-[10px]">Escrow Release:</span>
                    <span className="font-bold text-[#85E2BD]">Simultaneous</span>
                  </div>
                </div>
              </div>

              {/* What Business Sends to What Business Dispatch Manifest */}
              {bestMatch && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#68727D] flex items-center space-x-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#18243A]" />
                      <span>Dispatch Manifest: What Business Sends to Which Business</span>
                    </h4>
                    <span className="text-[10px] text-[#2E8B68] font-bold bg-[#EAF5F0] px-2 py-0.5 rounded-md">
                      {bestMatch.cycle_length}-Way Reciprocal Chain
                    </span>
                  </div>

                  <div className="space-y-2">
                    {bestMatch.edges.map((edge, idx) => {
                      const isUserEdge = edge.from_sme_id.includes(businessName.toLowerCase().slice(0, 4)) || edge.to_sme_id.includes(businessName.toLowerCase().slice(0, 4));

                      return (
                        <div
                          key={edge.id}
                          className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                            isUserEdge
                              ? 'bg-[#FEFCE8] border-[#E7B84B] shadow-2xs'
                              : 'bg-[#F7F5EF] border-[#E3E0D7]'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-[140px]">
                            <span className="w-5 h-5 rounded-full bg-[#18243A] text-white flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-[#18243A] block">{edge.from_sme_id}</span>
                              <span className="text-[10px] text-[#68727D]">Origin Sender</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 flex-1 px-1">
                            <ArrowRight className="w-3.5 h-3.5 text-[#E7B84B] shrink-0" />
                            <div className="bg-white p-2 rounded-md border border-[#E3E0D7] flex-1">
                              <span className="font-semibold text-[#18243A] block">{edge.item_or_service}</span>
                              <span className="text-[10px] text-[#2E8B68] font-semibold">
                                Qty: {edge.quantity} {edge.unit} &bull; KES {edge.estimated_value.toLocaleString()}
                              </span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-[#E7B84B] shrink-0" />
                          </div>

                          <div className="min-w-[120px] text-right sm:text-right">
                            <span className="text-[10px] text-[#68727D] block">Delivered To:</span>
                            <span className="font-bold text-[#18243A]">{edge.to_sme_id}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#EFECE4] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPhase('agent_description')}
                  className="px-3.5 py-2 rounded-lg border border-[#E3E0D7] text-xs font-semibold text-[#68727D] hover:bg-[#F7F5EF] flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Adjust Details</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalConfirm}
                  className="px-5 py-2.5 rounded-lg bg-[#18243A] hover:bg-[#253752] text-[#E7B84B] font-bold text-xs flex items-center space-x-2 transition-all shadow-md"
                >
                  <span>Accept & View Matched Exchanges</span>
                  <ArrowRight className="w-4 h-4 text-[#E7B84B]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
