import React, { useState } from 'react';
import { ExchangeCycle, SMEProfile } from '../agent/types';
import { CheckCircle2, Clock, UserCheck, RefreshCw, Truck, Copy, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MpesaTopUpCard } from './MpesaTopUpCard';

interface ExchangesTrackerProps {
  cycles: ExchangeCycle[];
  smes: Map<string, SMEProfile>;
  onCommitAll: (cycleId: string) => void;
  onSimulateDecline: (cycleId: string) => void;
  onReset: () => void;
}

const LIFECYCLE_STAGES = [
  { id: 'Committed', label: 'Agreed', desc: 'Everyone approved' },
  { id: 'Escrow_Locked', label: 'Locked In', desc: 'Commitments held jointly' },
  { id: 'Dispatched', label: 'On the Way', desc: 'Goods & services moving' },
  { id: 'Delivered_Settled', label: 'Done', desc: 'Everyone has what they need' },
] as const;

export const ExchangesTracker: React.FC<ExchangesTrackerProps> = ({
  cycles,
  smes,
  onCommitAll,
  onSimulateDecline,
  onReset,
}) => {
  const activeCycle = cycles[0];
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [customStage, setCustomStage] = useState<'Committed' | 'Escrow_Locked' | 'Dispatched' | 'Delivered_Settled'>('Escrow_Locked');

  const getSmeName = (id: string) => smes.get(id)?.name || id;
  const getSmeSector = (id: string) => smes.get(id)?.sector || 'SME';

  const matchPercentage = activeCycle
    ? Math.round((activeCycle.score_breakdown?.final_score || 0.94) * 100)
    : 96;

  const handleCopyReceipt = () => {
    if (!activeCycle) return;
    const lines = activeCycle.edges
      .map((e) => `${getSmeName(e.from_sme_id)} -> ${getSmeName(e.to_sme_id)}: ${e.item_or_service} (~KES ${e.estimated_value.toLocaleString()})`)
      .join('\n');
    const text = `Cyclewise Trade Receipt\nTotal value: KES ${activeCycle.estimated_value_unlocked.toLocaleString()}\nCash paid: KES 0\n\n${lines}`;
    navigator.clipboard?.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2500);
  };

  if (!activeCycle) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm font-semibold">No active exchange yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Once you commit to a trade on Home, it shows up here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Clock className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold">Your Active Trade</h2>
                  <Badge variant="secondary">{matchPercentage}% match</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  KES {activeCycle.estimated_value_unlocked.toLocaleString()} total &bull; KES 0 cash required
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={onReset}>
              <RefreshCw data-icon="inline-start" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Stepper */}
      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LIFECYCLE_STAGES.map((st, i) => {
              const isDone = LIFECYCLE_STAGES.findIndex((s) => s.id === customStage) >= i;
              const isCurrent = customStage === st.id;

              return (
                <button
                  key={st.id}
                  onClick={() => setCustomStage(st.id)}
                  className={`p-3 rounded-xl border text-left transition-all text-xs ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground border-primary'
                      : isDone
                      ? 'bg-(--color-leaf-green)/10 border-(--color-leaf-green)/40'
                      : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{st.label}</span>
                    <span>{isDone ? '✓' : i + 1}</span>
                  </div>
                  <span className={`block mt-1 ${isCurrent ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {st.desc}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-2 border-t">
            {activeCycle.sme_sequence.map((smeId) => {
              const sme = smes.get(smeId);
              return (
                <div key={smeId} className="p-3 rounded-lg border bg-muted/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{sme?.name || smeId}</span>
                    <UserCheck className="size-4 text-(--color-leaf-green)" />
                  </div>
                  <span className="text-[10px] text-muted-foreground block">{sme?.sector}</span>
                  <span className="text-[11px] font-semibold text-(--color-leaf-green)">Approved</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              className="border-(--color-burnt-orange)/40 text-(--color-burnt-orange) hover:bg-(--color-burnt-orange)/10"
              onClick={() => onSimulateDecline(activeCycle.id)}
            >
              A partner backed out
            </Button>
            <Button
              size="sm"
              className="bg-(--color-leaf-green) text-white hover:bg-(--color-leaf-green)/90"
              onClick={() => {
                setCustomStage('Delivered_Settled');
                onCommitAll(activeCycle.id);
              }}
            >
              <CheckCircle2 data-icon="inline-start" />
              Mark as Complete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manifest: who sends what to whom */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Truck className="size-4" />
              What&apos;s moving
            </h3>
            <Button variant="outline" size="sm" onClick={handleCopyReceipt}>
              {copiedReceipt ? <Check data-icon="inline-start" className="text-(--color-leaf-green)" /> : <Copy data-icon="inline-start" />}
              {copiedReceipt ? 'Copied!' : 'Copy Receipt'}
            </Button>
          </div>

          <div className="space-y-3">
            {activeCycle.edges.map((edge, idx) => {
              const fromName = getSmeName(edge.from_sme_id);
              const toName = getSmeName(edge.to_sme_id);
              const fromSector = getSmeSector(edge.from_sme_id);
              const toSector = getSmeSector(edge.to_sme_id);

              return (
                <div
                  key={edge.id}
                  className="p-4 rounded-xl border bg-muted/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-[160px] space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Step {idx + 1}</span>
                    <span className="font-bold text-sm block">{fromName}</span>
                    <span className="text-[11px] text-muted-foreground">{fromSector}</span>
                  </div>

                  <div className="flex-1 bg-background p-3 rounded-lg border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Sends: {edge.item_or_service}</span>
                      <span className="text-(--color-leaf-green) font-bold">KES {edge.estimated_value.toLocaleString()}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{edge.quantity} {edge.unit}</span>
                  </div>

                  <div className="min-w-[160px] md:text-right space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Goes to</span>
                    <span className="font-bold text-sm block">{toName}</span>
                    <span className="text-[11px] text-muted-foreground">{toSector}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <MpesaTopUpCard cycle={activeCycle} smes={smes} />
    </div>
  );
};
