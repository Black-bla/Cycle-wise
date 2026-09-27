import React from 'react';
import { ExchangeCycle, SMEProfile } from '../agent/types';
import { ArrowRight, CheckCircle2, AlertTriangle, DollarSign, MessageCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CycleCardProps {
  cycle: ExchangeCycle;
  smes: Map<string, SMEProfile>;
  onCommit?: (cycleId: string) => void;
  onDecline?: (cycleId: string) => void;
  onAskAgent?: (cycle: ExchangeCycle) => void;
  onRequestSubstitute?: (cycleId: string) => void;
}

export const CycleCard: React.FC<CycleCardProps> = ({
  cycle,
  smes,
  onCommit,
  onDecline,
  onAskAgent,
  onRequestSubstitute,
}) => {
  const getSmeName = (id: string) => smes.get(id)?.name || id;
  const getSmeSector = (id: string) => smes.get(id)?.sector || 'SME';

  return (
    <Card>
      <CardContent className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold">{cycle.cycle_length} businesses, one trade</span>
            <Badge variant="secondary">{(cycle.score_breakdown.final_score * 100).toFixed(0)}% match</Badge>
          </div>
          <div className="flex items-center gap-1.5 text-(--color-leaf-green) font-bold text-sm">
            <DollarSign className="size-3.5" />
            <span>KES {cycle.estimated_value_unlocked.toLocaleString()} unlocked</span>
          </div>
        </div>

        {/* Who gives what to whom */}
        <div className="space-y-2.5">
          {cycle.edges.map((edge, idx) => {
            const fromName = getSmeName(edge.from_sme_id);
            const toName = getSmeName(edge.to_sme_id);
            const fromSector = getSmeSector(edge.from_sme_id);

            return (
              <div
                key={edge.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/50 border gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-[140px]">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold block">{fromName}</span>
                    <span className="text-[10px] text-muted-foreground">{fromSector}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-1 px-1">
                  <ArrowRight className="size-3.5 text-(--color-maize-gold) shrink-0" />
                  <div className="bg-background px-2 py-1 rounded-md border font-medium flex-1">
                    Gives: <span className="font-semibold">{edge.item_or_service}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">(~KES {edge.estimated_value.toLocaleString()})</span>
                  </div>
                  <ArrowRight className="size-3.5 text-(--color-maize-gold) shrink-0" />
                </div>

                <div className="min-w-[120px] text-right">
                  <span className="text-[11px] text-muted-foreground">to </span>
                  <span className="font-semibold">{toName}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Risk and Human Consent Warning */}
        {cycle.risk_flags.length > 0 && (
          <Alert className="border-(--color-burnt-orange)/30 bg-(--color-burnt-orange)/5 text-(--color-burnt-orange)">
            <AlertTriangle />
            <AlertDescription className="text-(--color-burnt-orange)/90">
              {cycle.risk_flags.join('. ')}
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            Status: <strong className="text-foreground">{cycle.status}</strong>
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {onAskAgent && (
              <Button size="sm" variant="secondary" onClick={() => onAskAgent(cycle)}>
                <MessageCircle data-icon="inline-start" />
                Ask a Question
              </Button>
            )}

            {onRequestSubstitute && (
              <Button
                size="sm"
                variant="outline"
                className="border-(--color-burnt-orange)/30 bg-(--color-burnt-orange)/5 text-(--color-burnt-orange) hover:bg-(--color-burnt-orange)/10"
                onClick={() => onRequestSubstitute(cycle.id)}
              >
                <RefreshCw data-icon="inline-start" />
                Find Replacement
              </Button>
            )}

            {onDecline && !onRequestSubstitute && (
              <Button size="sm" variant="outline" onClick={() => onDecline(cycle.id)}>
                Decline
              </Button>
            )}

            {onCommit && (
              <Button size="sm" onClick={() => onCommit(cycle.id)}>
                <CheckCircle2 data-icon="inline-start" />
                Commit to Trade
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
