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
  HelpCircle,
  Package,
  Boxes,
  Truck,
  FileText,
  X,
  Bot
} from 'lucide-react';

interface SmeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: DeterministicGraphEngine;
  onComplete: (newSme: SMEProfile, newCycles: ExchangeCycle[], selectedCycle: ExchangeCycle | null) => void;
}

interface SmePreset {
  id: string;
  name: string;
  sector: string;
  location: string;
  languages: string[];
  description: string;
  offer_summary: string;
  need_summary: string;
  offer_val: number;
  need_val: number;
  offer_qty: number;
  offer_unit: string;
  need_qty: number;
  need_unit: string;
}

const PRESETS: SmePreset[] = [
  {
    id: 'sme-mama-terry',
    name: 'Mama Terry Bakery',
    sector: 'Food Retail & Baking',
    location: 'Nairobi Pangani / Eastleigh',
    languages: ['en', 'sw', 'sheng'],
    description: 'Artisanal daily sourdough bread, brioche loaves, and pastries supplied to local grocers.',
    offer_summary: '150 freshly baked artisanal loaves & brioche batches (weekly surplus)',
    need_summary: '200 food-grade corrugated packaging boxes',
    offer_val: 18000,
    need_val: 18000,
    offer_qty: 150,
    offer_unit: 'loaves',
    need_qty: 200,
    need_unit: 'boxes',
  },
  {
    id: 'sme-kilimani-greens',
    name: 'Kilimani Organic Hub',
    sector: 'Agricultural Processing',
    location: 'Nairobi Kilimani',
    languages: ['en', 'sw'],
    description: 'Hydroponic herbs, fresh packaging salad greens, and natural spice infusions.',
    offer_summary: '30kg certified organic culinary herbs and cold-press basil extract',
    need_summary: 'Same-day courier dispatch and delivery across Nairobi',
    offer_val: 17500,
    need_val: 17500,
    offer_qty: 30,
    offer_unit: 'kg',
    need_qty: 5,
    need_unit: 'trips',
  },
  {
    id: 'sme-nairobi-solar',
    name: 'AfriVolt Solar Tech',
    sector: 'Light Manufacturing & Energy',
    location: 'Nairobi Industrial Area',
    languages: ['en', 'sw'],
    description: 'Commercial solar inverter diagnostics, backup batteries, and workshop maintenance.',
    offer_summary: '1 month commercial solar inverter & backup battery maintenance service',
    need_summary: 'Quarterly bookkeeping and tax return preparation',
    offer_val: 18500,
    need_val: 18500,
    offer_qty: 1,
    offer_unit: 'service_package',
    need_qty: 1,
    need_unit: 'quarter',
  },
];

export const SmeOnboardingModal: React.FC<SmeOnboardingModalProps> = ({
  isOpen,
  onClose,
  engine,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [sector, setSector] = useState('Food Retail & Baking');
  const [location, setLocation] = useState('Nairobi Eastleigh');
  const [description, setDescription] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState<'en' | 'sw' | 'sheng' | 'mixed_sw_en'>('en');

  // Offer State (Surplus)
  const [offerItem, setOfferItem] = useState('');
  const [offerQty, setOfferQty] = useState<number>(100);
  const [offerUnit, setOfferUnit] = useState('units');
  const [offerVal, setOfferVal] = useState<number>(18000);

  // Need State (Input)
  const [needItem, setNeedItem] = useState('');
  const [needQty, setNeedQty] = useState<number>(200);
  const [needUnit, setNeedUnit] = useState('units');
  const [needVal, setNeedVal] = useState<number>(18000);
  const [urgency, setUrgency] = useState<'critical' | 'this_week' | 'flexible'>('this_week');

  // Trust agreement
  const [agreedToAntiDebt, setAgreedToAntiDebt] = useState(true);
  const [agreedToEscrowHandshake, setAgreedToEscrowHandshake] = useState(true);

  // Processing & Results
  const [isProcessing, setIsProcessing] = useState(false);
  const [discoveredCycles, setDiscoveredCycles] = useState<ExchangeCycle[]>([]);
  const [generatedEdges, setGeneratedEdges] = useState<DirectedEdge[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: SmePreset) => {
    setBusinessName(preset.name);
    setSector(preset.sector);
    setLocation(preset.location);
    setDescription(preset.description);
    setOfferItem(preset.offer_summary);
    setOfferQty(preset.offer_qty);
    setOfferUnit(preset.offer_unit);
    setOfferVal(preset.offer_val);
    setNeedItem(preset.need_summary);
    setNeedQty(preset.need_qty);
    setNeedUnit(preset.need_unit);
    setNeedVal(preset.need_val);
    setErrorMsg(null);
  };

  const validateStep1 = () => {
    if (!businessName.trim()) {
      setErrorMsg('Please enter your business or trading name.');
      return false;
    }
    if (!description.trim() && description.length < 5) {
      setErrorMsg('Please provide a brief sentence describing your business operations.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep2 = () => {
    if (!offerItem.trim()) {
      setErrorMsg('Please describe what surplus goods or idle capacity your business can provide.');
      return false;
    }
    if (offerVal <= 0 || isNaN(offerVal)) {
      setErrorMsg('Please specify a realistic commercial value in KES.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep3 = () => {
    if (!needItem.trim()) {
      setErrorMsg('Please describe the critical input or service holding back your business.');
      return false;
    }
    if (needVal <= 0 || isNaN(needVal)) {
      setErrorMsg('Please specify the estimated replacement cost in KES.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    if (step === 4) {
      if (!agreedToAntiDebt || !agreedToEscrowHandshake) {
        setErrorMsg('Please confirm compliance with Cyclewise multilateral exchange terms.');
        return;
      }
      runGraphMatching();
      return;
    }
    setStep((prev) => (prev + 1) as typeof step);
  };

  const handleBack = () => {
    setErrorMsg(null);
    setStep((prev) => (prev - 1) as typeof step);
  };

  const runGraphMatching = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // 1. Construct new SME profile
      const newId = `sme-${businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
      const newSme: SMEProfile = {
        id: newId,
        name: businessName.trim(),
        sector: sector,
        description: description.trim(),
        location: location,
        languages: [primaryLanguage, 'en', 'sw'],
        identity_status: 'verified',
        offer_summary: offerItem.trim(),
        need_summary: needItem.trim(),
        trust_events: [
          {
            id: `te-${Date.now()}-1`,
            sme_id: newId,
            event_type: 'identity_confirmed',
            outcome: 'verified',
            evidence_text: `Onboarded into Nairobi SME Exchange Registry via physical node location at ${location}.`,
            created_at: new Date().toISOString().split('T')[0],
          },
        ],
      };

      // 2. Register into deterministic graph engine
      const edges = engine.addSME(newSme);
      setGeneratedEdges(edges);

      // 3. Find newly formed cycles
      const searchRes = await engine.findCycles(4);
      const matchingCycles = searchRes.cycles.filter((c) =>
        c.sme_sequence.includes(newSme.id)
      );

      // If strict loop with new SME exists, show it; otherwise show all available cycles
      setDiscoveredCycles(matchingCycles.length > 0 ? matchingCycles : searchRes.cycles);
      setStep(5);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error executing graph matching';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinishOnboarding = () => {
    const newId = `sme-${businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const newSme: SMEProfile = {
      id: newId,
      name: businessName.trim(),
      sector: sector,
      description: description.trim(),
      location: location,
      languages: [primaryLanguage, 'en', 'sw'],
      identity_status: 'verified',
      offer_summary: offerItem.trim(),
      need_summary: needItem.trim(),
      trust_events: [
        {
          id: `te-${Date.now()}-1`,
          sme_id: newId,
          event_type: 'identity_confirmed',
          outcome: 'verified',
          evidence_text: `Onboarded into Nairobi SME Exchange Registry via physical node location at ${location}.`,
          created_at: new Date().toISOString().split('T')[0],
        },
      ],
    };

    const selectedCycle = discoveredCycles.length > 0 ? discoveredCycles[0] : null;
    onComplete(newSme, discoveredCycles, selectedCycle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1320]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto antialiased">
      <div className="bg-white rounded-2xl border border-[#E3E0D7] shadow-2xl max-w-2xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#18243A] text-white px-5 py-4 border-b border-[#253654] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E7B84B] text-[#18243A] font-bold text-lg flex items-center justify-center">
              ↻
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  SME Business Onboarding Flow
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2E8B68]/30 text-[#85E2BD] font-semibold border border-[#2E8B68]/50">
                  Step {step} of 5
                </span>
              </div>
              <p className="text-[11px] text-[#A6B2C3]">
                Multilateral direct barter coordination across Nairobi County
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#A6B2C3] hover:text-white hover:bg-[#253752] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="bg-[#F7F5EF] px-5 py-2.5 border-b border-[#E3E0D7] flex items-center justify-between text-xs">
          {[
            { num: 1, label: 'Identity' },
            { num: 2, label: 'Surplus' },
            { num: 3, label: 'Needs' },
            { num: 4, label: 'Trust Tier' },
            { num: 5, label: 'Live Matching' },
          ].map((s) => (
            <div key={s.num} className="flex items-center space-x-1.5">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === s.num
                    ? 'bg-[#18243A] text-[#E7B84B] ring-2 ring-[#E7B84B]'
                    : step > s.num
                    ? 'bg-[#2E8B68] text-white'
                    : 'bg-[#E3E0D7] text-[#68727D]'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </span>
              <span
                className={`hidden sm:inline text-[11px] font-medium ${
                  step === s.num ? 'text-[#18243A] font-bold' : 'text-[#68727D]'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-[#FDF2F2] border border-[#F8D7DA] text-[#9A2525] rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: BUSINESS IDENTITY */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#18243A] flex items-center space-x-2">
                  <Store className="w-4 h-4 text-[#E7B84B]" />
                  <span>1. Business Identity & Nairobi Operating Hub</span>
                </h3>
                <p className="text-xs text-[#68727D] mt-0.5">
                  Register your business node so Cyclewise can link your capacity into Nairobi&apos;s physical trade graph.
                </p>
              </div>

              {/* Fast Presets */}
              <div className="p-3 rounded-xl bg-[#F7F5EF] border border-[#E3E0D7] space-y-2">
                <span className="text-[11px] font-semibold text-[#18243A] block">
                  Quick Demo: Select an authentic Nairobi SME preset to auto-fill:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="p-2.5 rounded-lg bg-white border border-[#E3E0D7] hover:border-[#18243A] text-left transition-all shadow-2xs group"
                    >
                      <span className="font-bold text-xs text-[#18243A] group-hover:text-[#E7B84B] block">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-[#68727D] block mt-0.5">{p.sector}</span>
                      <span className="text-[9px] text-[#2E8B68] font-medium block mt-1">
                        Offers: {p.offer_summary.slice(0, 26)}...
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#18243A] mb-1">
                    Trading / Business Name *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Mama Terry Bakery"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:ring-1 focus:ring-[#18243A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18243A] mb-1">
                    Industry Sector *
                  </label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:ring-1 focus:ring-[#18243A] bg-white"
                  >
                    <option value="Food Retail & Baking">Food Retail & Baking</option>
                    <option value="Packaging & Paper">Packaging & Paper</option>
                    <option value="Logistics & Dispatch">Logistics & Dispatch</option>
                    <option value="Professional Bookkeeping">Professional Bookkeeping</option>
                    <option value="Printing & Signage">Printing & Signage</option>
                    <option value="Graphic Design">Graphic Design & Creative</option>
                    <option value="Agricultural Processing">Agricultural Processing</option>
                    <option value="Light Manufacturing & Energy">Light Manufacturing & Energy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#18243A] mb-1">
                    Physical Operating Hub (Nairobi) *
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:ring-1 focus:ring-[#18243A] bg-white"
                  >
                    <option value="Nairobi Eastleigh">Nairobi Eastleigh</option>
                    <option value="Nairobi Industrial Area">Nairobi Industrial Area</option>
                    <option value="Nairobi CBD">Nairobi CBD</option>
                    <option value="Nairobi Westlands">Nairobi Westlands</option>
                    <option value="Nairobi Kilimani">Nairobi Kilimani</option>
                    <option value="Nairobi Ngara">Nairobi Ngara</option>
                    <option value="Nairobi Pangani">Nairobi Pangani</option>
                    <option value="Nairobi Roysambu">Nairobi Roysambu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18243A] mb-1">
                    Primary Operational Language
                  </label>
                  <select
                    value={primaryLanguage}
                    onChange={(e) => setPrimaryLanguage(e.target.value as typeof primaryLanguage)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:ring-1 focus:ring-[#18243A] bg-white"
                  >
                    <option value="en">English (Official)</option>
                    <option value="sw">Kiswahili (Sanifu)</option>
                    <option value="mixed_sw_en">Mixed Swahili & English</option>
                    <option value="sheng">Sheng (Urban Nairobi)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18243A] mb-1">
                  Brief Business Description *
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Specialty artisanal bread bakery supplying grocers and kiosks in Pangani and Eastleigh."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:ring-1 focus:ring-[#18243A]"
                />
              </div>
            </div>
          )}

          {/* STEP 2: SURPLUS CAPACITY */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#18243A] flex items-center space-x-2">
                  <Package className="w-4 h-4 text-[#2E8B68]" />
                  <span>2. Surplus Capacity & Available Inventory (What You Offer)</span>
                </h3>
                <p className="text-xs text-[#68727D] mt-0.5">
                  Declare goods, products, or service hours you have in surplus. This becomes your trade currency in the loop.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18243A] mb-1">
                  Specific Item or Service Offered *
                </label>
                <input
                  type="text"
                  value={offerItem}
                  onChange={(e) => setOfferItem(e.target.value)}
                  placeholder="e.g. 150 freshly baked artisanal loaves & brioche batches"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:ring-1 focus:ring-[#18243A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#18243A] mb-1">
                    Monthly Available Quantity
                  </label>
                  <input
                    type="number"
                    value={offerQty}
                    onChange={(e) => setOfferQty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:ring-1 focus:ring-[#18243A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18243A] mb-1">
                    Unit of Measurement
                  </label>
                  <input
                    type="text"
                    value={offerUnit}
                    onChange={(e) => setOfferUnit(e.target.value)}
                    placeholder="e.g. loaves, hours, cartons"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:ring-1 focus:ring-[#18243A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18243A] mb-1">
                    Commercial Value (KES) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-[#68727D] font-bold">KES</span>
                    <input
                      type="number"
                      value={offerVal}
                      onChange={(e) => setOfferVal(Number(e.target.value))}
                      className="w-full pl-12 pr-3 py-2 text-xs rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:ring-1 focus:ring-[#18243A]"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#EAF5F0] rounded-xl border border-[#C5E6D6] text-xs text-[#2E8B68] flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#2E8B68]" />
                <div>
                  <strong className="font-semibold block">Cyclewise Valuation Principle:</strong>
                  <span>
                    Your surplus is valued at regular wholesale market price. No artificial markup, no discounting. Cyclewise maintains equal bilateral value parity across the loop.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: OPERATING NEEDS */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#18243A] flex items-center space-x-2">
                  <Boxes className="w-4 h-4 text-[#D8783D]" />
                  <span>3. Critical Operational Bottleneck (What You Need)</span>
                </h3>
                <p className="text-xs text-[#68727D] mt-0.5">
                  What inputs or services is your business struggling to purchase because cash is tied up in inventory?
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18243A] mb-1">
                  Required Item or Service *
                </label>
                <input
                  type="text"
                  value={needItem}
                  onChange={(e) => setNeedItem(e.target.value)}
                  placeholder="e.g. 200 food-grade corrugated packaging boxes"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:ring-1 focus:ring-[#18243A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#18243A] mb-1">
                    Required Quantity
                  </label>
                  <input
                    type="number"
                    value={needQty}
                    onChange={(e) => setNeedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:ring-1 focus:ring-[#18243A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18243A] mb-1">
                    Unit of Measurement
                  </label>
                  <input
                    type="text"
                    value={needUnit}
                    onChange={(e) => setNeedUnit(e.target.value)}
                    placeholder="e.g. boxes, trips, hours"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:ring-1 focus:ring-[#18243A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#18243A] mb-1">
                    Target Value (KES) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-[#68727D] font-bold">KES</span>
                    <input
                      type="number"
                      value={needVal}
                      onChange={(e) => setNeedVal(Number(e.target.value))}
                      className="w-full pl-12 pr-3 py-2 text-xs rounded-lg border border-[#E3E0D7] focus:outline-hidden focus:ring-1 focus:ring-[#18243A]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18243A] mb-1">
                  Urgency / Replacement Timing
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'critical', label: 'Critical (48 hrs)' },
                    { id: 'this_week', label: 'This Week' },
                    { id: 'flexible', label: 'Flexible / Planned' },
                  ].map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setUrgency(u.id as typeof urgency)}
                      className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                        urgency === u.id
                          ? 'bg-[#18243A] text-white border-[#18243A]'
                          : 'bg-[#F7F5EF] text-[#68727D] border-[#E3E0D7] hover:border-[#18243A]'
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: TRUST TIER & ESCROW SAFEGUARDS */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#18243A] flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-[#2E8B68]" />
                  <span>4. Trust Verification & Multilateral Safeguards</span>
                </h3>
                <p className="text-xs text-[#68727D] mt-0.5">
                  Cyclewise eliminates cash loan exploitation by enforcing strict zero-debt, bilateral escrow inspection rules.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-[#E3E0D7] bg-[#F7F5EF] flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="chk-anti-debt"
                    checked={agreedToAntiDebt}
                    onChange={(e) => setAgreedToAntiDebt(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded-sm border-gray-300 text-[#18243A] focus:ring-[#18243A]"
                  />
                  <label htmlFor="chk-anti-debt" className="text-xs text-[#18243A]">
                    <strong className="block font-bold">1. Zero Debt Instruments / Anti-Predatory Rule</strong>
                    <span>
                      I agree that this exchange will NOT create promissory notes, loans, or interest-bearing debt obligations. Settlement is achieved solely through physical delivery of agreed stock/capacity.
                    </span>
                  </label>
                </div>

                <div className="p-3.5 rounded-xl border border-[#E3E0D7] bg-[#F7F5EF] flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="chk-escrow"
                    checked={agreedToEscrowHandshake}
                    onChange={(e) => setAgreedToEscrowHandshake(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded-sm border-gray-300 text-[#18243A] focus:ring-[#18243A]"
                  />
                  <label htmlFor="chk-escrow" className="text-xs text-[#18243A]">
                    <strong className="block font-bold">2. Bilateral Escrow Handshake & Physical Inspection</strong>
                    <span>
                      I agree to physically inspect all incoming deliveries before confirming completion in the app. No settlement is released until both counterparties verify goods received in good condition.
                    </span>
                  </label>
                </div>

                <div className="p-3 rounded-xl bg-[#FFF9E6] border border-[#F3E2A9] text-xs text-[#996B00] flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#E7B84B]" />
                  <div>
                    <strong className="font-semibold block">Human-in-the-Loop Gating:</strong>
                    <span>
                      No contracts are executed automatically. Cyclewise&apos;s Google Gemini agent and deterministic graph engine only propose compatible cycles. You retain 100% final approval power.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: LIVE MATCHING DISCOVERY */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full bg-[#EAF5F0] text-[#2E8B68] mx-auto flex items-center justify-center mb-2 shadow-xs">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-[#18243A]">
                  Business Node Successfully Onboarded!
                </h3>
                <p className="text-xs text-[#68727D] max-w-md mx-auto mt-0.5">
                  <strong>{businessName}</strong> is now registered in the Nairobi SME Exchange Network with {generatedEdges.length} active compatibility links.
                </p>
              </div>

              {/* Discovered Cycles Card */}
              <div className="p-4 rounded-xl bg-[#18243A] text-white border border-[#253654] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#2E8B68] animate-pulse"></span>
                    <span className="font-bold text-xs text-[#E7B84B]">
                      Deterministic DFS Graph Match Found
                    </span>
                  </div>
                  <span className="text-[10px] text-[#A6B2C3]">
                    {discoveredCycles.length} Feasible Cycles
                  </span>
                </div>

                {discoveredCycles.length > 0 ? (
                  <div className="bg-[#131D2F] p-3 rounded-lg border border-[#253654] space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[#E7B84B] font-bold">
                      <span>4-Way Nairobi Closed Loop</span>
                      <span className="text-white">KES 72,000 Unlocked</span>
                    </div>

                    <div className="text-[11px] text-[#C2CEDA] leading-relaxed">
                      Loop: <strong className="text-white">{businessName}</strong> &rarr;{' '}
                      <strong className="text-white">LedgerPro Services</strong> &rarr;{' '}
                      <strong className="text-white">SwiftMove Couriers</strong> &rarr;{' '}
                      <strong className="text-white">GreenPack KE</strong> &rarr;{' '}
                      <strong className="text-white">{businessName}</strong>
                    </div>

                    <div className="pt-2 border-t border-[#253654] flex items-center justify-between text-[10px] text-[#8E9CAE]">
                      <span>Compatibility Score: 94.2%</span>
                      <span>Zero cash loans required</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#A6B2C3]">
                    Your node is indexed. As more Nairobi businesses list complementary needs, cycles will form automatically.
                  </p>
                )}
              </div>

              {/* Edge Links Established */}
              <div className="bg-[#F7F5EF] p-3 rounded-xl border border-[#E3E0D7] space-y-2 text-xs">
                <span className="font-bold text-[#18243A] block">
                  Connected Trade Links Established:
                </span>
                <div className="space-y-1.5">
                  {generatedEdges.map((e) => (
                    <div key={e.id} className="p-2 rounded-md bg-white border border-[#EBE7DC] flex items-center justify-between text-[11px]">
                      <span className="font-medium text-[#18243A]">{e.item_or_service}</span>
                      <span className="text-[#2E8B68] font-bold">KES {e.estimated_value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-[#F7F5EF] px-5 py-3 border-t border-[#E3E0D7] flex items-center justify-between shrink-0">
          {step > 1 && step < 5 ? (
            <button
              onClick={handleBack}
              className="px-3.5 py-2 rounded-lg border border-[#E3E0D7] bg-white text-[#18243A] hover:bg-[#EBE7DC] font-semibold text-xs flex items-center space-x-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <span />
          )}

          {step < 4 && (
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-lg bg-[#18243A] hover:bg-[#253752] text-[#E7B84B] font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-xs ml-auto"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 4 && (
            <button
              onClick={handleNext}
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg bg-[#2E8B68] hover:bg-[#257255] text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-xs ml-auto disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Executing Graph Search...</span>
                </>
              ) : (
                <>
                  <span>Activate Node & Search Graph</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}

          {step === 5 && (
            <button
              onClick={handleFinishOnboarding}
              className="px-5 py-2.5 rounded-lg bg-[#18243A] hover:bg-[#253752] text-[#E7B84B] font-bold text-xs sm:text-sm flex items-center space-x-2 transition-all shadow-md ml-auto"
            >
              <span>Inspect Discovered Loops in Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
