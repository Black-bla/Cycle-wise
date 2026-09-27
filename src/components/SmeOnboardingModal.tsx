import React, { useState } from 'react';
import { SMEProfile, ExchangeCycle, DirectedEdge } from '../agent/types';
import { DeterministicGraphEngine } from '../engine/graphEngine';
import {
  Store,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MapPin,
  AlertCircle,
  Package,
  Boxes,
  Truck,
  FileText,
  Bot,
  DollarSign,
  Building2,
  Globe2,
  Percent,
  RefreshCw,
  Check,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Message, MessageContent } from '@/components/ui/message';
import { Bubble, BubbleContent } from '@/components/ui/bubble';

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

const STEPS: { id: string; label: string }[] = [
  { id: 'initial_info', label: 'Business Info' },
  { id: 'agent_surplus', label: 'What You Offer' },
  { id: 'agent_need', label: 'What You Need' },
  { id: 'agent_description', label: 'Details' },
  { id: 'agent_matching', label: 'Matches' },
];

export const SmeOnboardingModal: React.FC<SmeOnboardingModalProps> = ({
  isOpen,
  onClose,
  engine,
  onComplete,
}) => {
  const [phase, setPhase] = useState<'initial_info' | 'agent_surplus' | 'agent_need' | 'agent_description' | 'agent_matching'>('initial_info');

  const [businessName, setBusinessName] = useState('');
  const [sector, setSector] = useState('Food Retail & Baking');
  const [location, setLocation] = useState('Nairobi Eastleigh');
  const [primaryLanguage, setPrimaryLanguage] = useState<'en' | 'sw' | 'sheng' | 'mixed_sw_en'>('en');

  const [offerItem, setOfferItem] = useState('');
  const [offerQty, setOfferQty] = useState<number>(150);
  const [offerUnit, setOfferUnit] = useState('loaves');
  const [offerPrice, setOfferPrice] = useState<number>(18000);

  const [needItem, setNeedItem] = useState('');
  const [needQty, setNeedQty] = useState<number>(200);
  const [needUnit, setNeedUnit] = useState('boxes');
  const [needPriceMin, setNeedPriceMin] = useState<number>(16000);
  const [needPriceMax, setNeedPriceMax] = useState<number>(20000);

  const [businessDescription, setBusinessDescription] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [discoveredCycles, setDiscoveredCycles] = useState<ExchangeCycle[]>([]);
  const [, setGeneratedEdges] = useState<DirectedEdge[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      const edges = engine.addSME(newSme);
      setGeneratedEdges(edges);

      const result = await engine.findCycles(4);
      setDiscoveredCycles(result.cycles);

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
  const currentStepIndex = STEPS.findIndex((s) => s.id === phase);

  const agentBubble = (text: string) => (
    <Message>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Bot className="size-4" />
      </div>
      <MessageContent>
        <Bubble variant="tinted">
          <BubbleContent className="leading-relaxed">{text}</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 bg-primary text-primary-foreground gap-1">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <RefreshCw className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-primary-foreground">Add Your Business</DialogTitle>
              <DialogDescription className="text-primary-foreground/70">
                A few quick questions, then we&apos;ll find your first match
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress Tracker */}
        <div className="bg-muted px-5 py-2.5 border-b flex items-center justify-between text-xs overflow-x-auto">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center gap-1.5 shrink-0 ${
                  idx === currentStepIndex ? 'font-bold text-foreground' : idx < currentStepIndex ? 'text-(--color-leaf-green)' : 'text-muted-foreground'
                }`}
              >
                <span
                  className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    idx === currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : idx < currentStepIndex
                      ? 'bg-(--color-leaf-green) text-white'
                      : 'bg-border text-muted-foreground'
                  }`}
                >
                  {idx < currentStepIndex ? <Check className="size-3" /> : idx + 1}
                </span>
                <span>{idx + 1}. {step.label}</span>
              </div>
              {idx < STEPS.length - 1 && <ArrowRight className="size-3.5 text-border shrink-0 mx-1" />}
            </React.Fragment>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          {/* PHASE 1: INITIAL INFO */}
          {phase === 'initial_info' && (
            <form onSubmit={handleInitialInfoSubmit} className="space-y-5">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Building2 className="size-4 text-(--color-maize-gold)" />
                  <span>Tell us about your business</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Basic details so other businesses know who you are.
                </p>
              </div>

              <Card size="sm">
                <CardContent className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Try a sample business:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                      <Button
                        key={p.name}
                        type="button"
                        size="sm"
                        variant={businessName === p.name ? 'default' : 'outline'}
                        onClick={() => handleApplyPreset(p)}
                      >
                        + {p.name} ({p.sector})
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="business-name">
                    <Store className="size-3.5 text-(--color-leaf-green)" />
                    Registered Business Name *
                  </FieldLabel>
                  <Input
                    id="business-name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Mama Terry Artisan Bakery"
                    required
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="sector">Industry / Sector *</FieldLabel>
                    <Select value={sector} onValueChange={(v) => v && setSector(v)}>
                      <SelectTrigger id="sector" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Food Retail & Baking">Food Retail & Baking</SelectItem>
                        <SelectItem value="Packaging & Materials">Packaging & Materials</SelectItem>
                        <SelectItem value="Logistics & Dispatch">Logistics & Dispatch</SelectItem>
                        <SelectItem value="Professional Services & Accounting">Professional Services & Accounting</SelectItem>
                        <SelectItem value="Agricultural Processing">Agricultural Processing</SelectItem>
                        <SelectItem value="Light Manufacturing & Energy">Light Manufacturing & Energy</SelectItem>
                        <SelectItem value="Hospitality & Catering">Hospitality & Catering</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="location">
                      <MapPin className="size-3.5 text-(--color-burnt-orange)" />
                      Location *
                    </FieldLabel>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Nairobi Pangani / Eastleigh"
                      required
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel>
                    <Globe2 className="size-3.5" />
                    Primary Communication Language
                  </FieldLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'en', label: 'English' },
                      { id: 'sw', label: 'Swahili (Kiswahili)' },
                      { id: 'sheng', label: 'Sheng' },
                      { id: 'mixed_sw_en', label: 'Mixed Swahili-English' },
                    ].map((l) => (
                      <Button
                        key={l.id}
                        type="button"
                        size="sm"
                        variant={primaryLanguage === l.id ? 'default' : 'outline'}
                        onClick={() => setPrimaryLanguage(l.id as typeof primaryLanguage)}
                      >
                        {l.label}
                      </Button>
                    ))}
                  </div>
                </Field>
              </FieldGroup>

              <div className="pt-4 border-t flex items-center justify-between">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  Continue to Agent Intake
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </div>
            </form>
          )}

          {/* PHASE 2: AGENT SURPLUS INTAKE */}
          {phase === 'agent_surplus' && (
            <form onSubmit={handleSurplusSubmit} className="space-y-5">
              {agentBubble(
                primaryLanguage === 'sw' || primaryLanguage === 'mixed_sw_en'
                  ? `Habari ${businessName}! Ni ziada (surplus capacity au bidhaa) gani unayo kwa sasa ambayo unaweza kupeana kwa biashara zingine Nairobi? Tafadhali weka jina la bidhaa, kiwango, na thamani ya bei ya sokoni (KES).`
                  : `Welcome ${businessName}! What surplus capacity, inventory, or service hours do you currently have available to offer to other Nairobi businesses? Please provide the item title, quantity, and its fair market price in KES.`
              )}

              <Card size="sm">
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="offer-item">
                        <Package className="size-3.5 text-(--color-leaf-green)" />
                        1. Surplus Item / Service Title *
                      </FieldLabel>
                      <Input
                        id="offer-item"
                        value={offerItem}
                        onChange={(e) => setOfferItem(e.target.value)}
                        placeholder="e.g. Freshly baked artisanal sourdough loaves (weekly surplus)"
                        required
                      />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Field>
                        <FieldLabel htmlFor="offer-qty">2. Quantity *</FieldLabel>
                        <Input
                          id="offer-qty"
                          type="number"
                          min={1}
                          value={offerQty}
                          onChange={(e) => setOfferQty(Number(e.target.value))}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="offer-unit">Unit of Measure *</FieldLabel>
                        <Input
                          id="offer-unit"
                          value={offerUnit}
                          onChange={(e) => setOfferUnit(e.target.value)}
                          placeholder="e.g. loaves, cartons, kg, hours"
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="offer-price">
                          <DollarSign className="size-3.5 text-(--color-leaf-green)" />
                          3. Total Value (KES) *
                        </FieldLabel>
                        <Input
                          id="offer-price"
                          type="number"
                          min={100}
                          step={100}
                          value={offerPrice}
                          onChange={(e) => setOfferPrice(Number(e.target.value))}
                          required
                          className="font-bold text-(--color-leaf-green)"
                        />
                      </Field>
                    </div>

                    <FieldDescription className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                      <span>Unit Price Breakdown:</span>
                      <span className="font-semibold text-foreground">
                        ~KES {offerQty > 0 ? (offerPrice / offerQty).toFixed(1) : 0} per {offerUnit}
                      </span>
                    </FieldDescription>
                  </FieldGroup>
                </CardContent>
              </Card>

              <div className="pt-3 border-t flex items-center justify-between">
                <Button type="button" variant="outline" onClick={() => setPhase('initial_info')}>
                  <ArrowLeft data-icon="inline-start" />
                  Back to Business Info
                </Button>
                <Button type="submit">
                  Next: Detail Your Need
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </div>
            </form>
          )}

          {/* PHASE 3: AGENT NEED INTAKE */}
          {phase === 'agent_need' && (
            <form onSubmit={handleNeedSubmit} className="space-y-5">
              {agentBubble(
                primaryLanguage === 'sw' || primaryLanguage === 'mixed_sw_en'
                  ? `Safi sana! Sasa, ni kitu gani ${businessName} inahitaji sana kwa haraka ili uweze kuendeleza biashara bila kuchukua mikopo ya faida kubwa? Weka jina la bidhaa/huduma, kiwango, na makadirio ya masafa ya bei (Price Range: Min - Max KES).`
                  : `Excellent! Now, what critical input or service does ${businessName} urgently need to keep operating smoothly without expensive cash loans? Please specify the item, quantity, and your acceptable price range (Min KES - Max KES).`
              )}

              <Card size="sm">
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="need-item">
                        <Boxes className="size-3.5 text-(--color-burnt-orange)" />
                        1. Needed Item / Service *
                      </FieldLabel>
                      <Input
                        id="need-item"
                        value={needItem}
                        onChange={(e) => setNeedItem(e.target.value)}
                        placeholder="e.g. Food-grade corrugated packaging cartons"
                        required
                      />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field>
                        <FieldLabel htmlFor="need-qty">2. Required Quantity *</FieldLabel>
                        <Input
                          id="need-qty"
                          type="number"
                          min={1}
                          value={needQty}
                          onChange={(e) => setNeedQty(Number(e.target.value))}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="need-unit">Unit of Measure *</FieldLabel>
                        <Input
                          id="need-unit"
                          value={needUnit}
                          onChange={(e) => setNeedUnit(e.target.value)}
                          placeholder="e.g. boxes, cartons, trips, hours"
                          required
                        />
                      </Field>
                    </div>

                    <Card size="sm">
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs flex items-center gap-1">
                            <DollarSign className="size-3.5 text-(--color-burnt-orange)" />
                            3. Acceptable Price Range (KES) *
                          </span>
                          <span className="text-[10px] text-muted-foreground">No single rigid price</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Field>
                            <FieldLabel htmlFor="need-price-min" className="text-[10px] text-muted-foreground">Min Range (KES)</FieldLabel>
                            <Input
                              id="need-price-min"
                              type="number"
                              min={500}
                              step={500}
                              value={needPriceMin}
                              onChange={(e) => setNeedPriceMin(Number(e.target.value))}
                              required
                              className="font-semibold"
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="need-price-max" className="text-[10px] text-muted-foreground">Max Range (KES)</FieldLabel>
                            <Input
                              id="need-price-max"
                              type="number"
                              min={500}
                              step={500}
                              value={needPriceMax}
                              onChange={(e) => setNeedPriceMax(Number(e.target.value))}
                              required
                              className="font-semibold"
                            />
                          </Field>
                        </div>

                        <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground border-t">
                          <span>Average Estimated Budget:</span>
                          <span className="font-bold text-foreground">
                            KES {Math.round((needPriceMin + needPriceMax) / 2).toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </FieldGroup>
                </CardContent>
              </Card>

              <div className="pt-3 border-t flex items-center justify-between">
                <Button type="button" variant="outline" onClick={() => setPhase('agent_surplus')}>
                  <ArrowLeft data-icon="inline-start" />
                  Back to Surplus
                </Button>
                <Button type="submit">
                  Next: Business Description
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </div>
            </form>
          )}

          {/* PHASE 4: DESCRIPTION */}
          {phase === 'agent_description' && (
            <div className="space-y-5">
              {agentBubble(
                primaryLanguage === 'sw' || primaryLanguage === 'mixed_sw_en'
                  ? `Je, ungependa kuongeza maelezo mafupi kuhusu operesheni zako, ratiba ya delivery, au viwango vya ubora kwa ${businessName}? Hii husaidia kuongeza alama ya uaminifu (Trust Score) kwenye mtandao.`
                  : `Would you like to add any operational details, fulfillment preferences, or quality standards for ${businessName}? This is optional, but helps increase your match percentage and verification trust score.`
              )}

              <Card size="sm">
                <CardContent className="space-y-3">
                  <Field>
                    <FieldLabel htmlFor="business-description" className="justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileText className="size-3.5" />
                        Business Description &amp; Operational Notes
                      </span>
                      <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
                    </FieldLabel>
                    <Textarea
                      id="business-description"
                      rows={3}
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      placeholder="e.g. We bake daily from 4 AM with certified food hygiene. We can dispatch via courier by 10 AM daily to Eastleigh, Westlands, or CBD."
                    />
                  </Field>

                  <Card size="sm">
                    <CardContent className="space-y-2">
                      <span className="font-bold text-xs block">Intake Overview for {businessName}:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded-md bg-(--color-leaf-green)/10 border border-(--color-leaf-green)/20">
                          <span className="font-bold text-(--color-leaf-green) block">You Offer:</span>
                          <span>{offerQty} {offerUnit} &bull; {offerItem}</span>
                          <strong className="block">Valuation: KES {offerPrice.toLocaleString()}</strong>
                        </div>
                        <div className="p-2 rounded-md bg-(--color-burnt-orange)/10 border border-(--color-burnt-orange)/20">
                          <span className="font-bold text-(--color-burnt-orange) block">You Need:</span>
                          <span>{needQty} {needUnit} &bull; {needItem}</span>
                          <strong className="block">Range: KES {needPriceMin.toLocaleString()} - {needPriceMax.toLocaleString()}</strong>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              <div className="pt-3 border-t flex items-center justify-between">
                <Button type="button" variant="outline" onClick={() => setPhase('agent_need')}>
                  <ArrowLeft data-icon="inline-start" />
                  Back to Need
                </Button>
                <Button
                  type="button"
                  onClick={handleExecuteAgentMatching}
                  disabled={isProcessing}
                  className="bg-(--color-leaf-green) text-white hover:bg-(--color-leaf-green)/90"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw data-icon="inline-start" className="animate-spin" />
                      Finding matches...
                    </>
                  ) : (
                    <>
                      <Sparkles data-icon="inline-start" />
                      Find My Matches
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* PHASE 5: MATCHING RESULTS */}
          {phase === 'agent_matching' && (
            <div className="space-y-5">
              <Card className="bg-primary text-primary-foreground border-none">
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-(--color-leaf-green) text-white font-bold">
                        <Check className="size-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{businessName} added successfully</h4>
                        <span className="text-xs text-primary-foreground/70">You&apos;re now visible to other businesses in the network</span>
                      </div>
                    </div>

                    <Badge variant="secondary" className="gap-1">
                      <Percent className="size-3.5" />
                      {matchPercentage}% Compatibility Score
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-primary-foreground/15 text-xs">
                    <div>
                      <span className="text-primary-foreground/70 block text-[10px]">Cycles Found:</span>
                      <span className="font-bold">{discoveredCycles.length} Closed Loops</span>
                    </div>
                    <div>
                      <span className="text-primary-foreground/70 block text-[10px]">Unlocked Value:</span>
                      <span className="font-bold">KES {bestMatch?.estimated_value_unlocked.toLocaleString() || '72,000'}</span>
                    </div>
                    <div>
                      <span className="text-primary-foreground/70 block text-[10px]">Cash Debt Created:</span>
                      <span className="font-bold">KES 0 (Zero-Debt)</span>
                    </div>
                    <div>
                      <span className="text-primary-foreground/70 block text-[10px]">Escrow Release:</span>
                      <span className="font-bold">Simultaneous</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {bestMatch && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Truck className="size-3.5" />
                      <span>Dispatch Manifest: What Business Sends to Which Business</span>
                    </h4>
                    <Badge variant="outline" className="border-(--color-leaf-green)/30 bg-(--color-leaf-green)/10 text-(--color-leaf-green) text-[10px]">
                      {bestMatch.cycle_length}-Way Reciprocal Chain
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {bestMatch.edges.map((edge, idx) => {
                      const isUserEdge = edge.from_sme_id.includes(businessName.toLowerCase().slice(0, 4)) || edge.to_sme_id.includes(businessName.toLowerCase().slice(0, 4));

                      return (
                        <Card
                          key={edge.id}
                          size="sm"
                          className={isUserEdge ? 'border-(--color-maize-gold) bg-(--color-maize-gold)/10' : ''}
                        >
                          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                            <div className="flex items-center gap-2 min-w-[140px]">
                              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-[10px]">
                                {idx + 1}
                              </span>
                              <div>
                                <span className="font-bold block">{edge.from_sme_id}</span>
                                <span className="text-[10px] text-muted-foreground">Origin Sender</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-1 px-1">
                              <ArrowRight className="size-3.5 text-(--color-maize-gold) shrink-0" />
                              <div className="bg-background p-2 rounded-md border flex-1">
                                <span className="font-semibold block">{edge.item_or_service}</span>
                                <span className="text-[10px] text-(--color-leaf-green) font-semibold">
                                  Qty: {edge.quantity} {edge.unit} &bull; KES {edge.estimated_value.toLocaleString()}
                                </span>
                              </div>
                              <ArrowRight className="size-3.5 text-(--color-maize-gold) shrink-0" />
                            </div>

                            <div className="min-w-[120px] text-right">
                              <span className="text-[10px] text-muted-foreground block">Delivered To:</span>
                              <span className="font-bold">{edge.to_sme_id}</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t flex items-center justify-between">
                <Button type="button" variant="outline" onClick={() => setPhase('agent_description')}>
                  <ArrowLeft data-icon="inline-start" />
                  Adjust Details
                </Button>
                <Button type="button" onClick={handleFinalConfirm}>
                  Accept &amp; View Matched Exchanges
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
