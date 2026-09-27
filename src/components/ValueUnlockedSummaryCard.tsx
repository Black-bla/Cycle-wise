import React, { useState } from 'react';
import { ExchangeCycle, SMEProfile } from '../agent/types';
import { ArrowRight, Copy, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ValueUnlockedSummaryCardProps {
  cycle: ExchangeCycle;
  smes: Map<string, SMEProfile>;
  onCommit?: (cycleId: string) => void;
}

const LOAN_INTEREST_RATE = 20; // typical informal 30-day loan rate, for the savings comparison

export const ValueUnlockedSummaryCard: React.FC<ValueUnlockedSummaryCardProps> = ({
  cycle,
  smes,
  onCommit,
}) => {
  const [copied, setCopied] = useState(false);

  const totalValue = cycle.estimated_value_unlocked;
  const interestAvoided = Math.round((totalValue * LOAN_INTEREST_RATE) / 100);
  const participantNames = cycle.sme_sequence.map((id) => smes.get(id)?.name || id);

  const handleCopySummary = async () => {
    const summaryText = `Cyclewise Trade Summary:
Participants (${participantNames.length}): ${participantNames.join(', ')}
Total Value: KES ${totalValue.toLocaleString()}
Cash Needed: KES 0
Est. Loan Interest Avoided: KES ${interestAvoided.toLocaleString()}`;

    try {
      await navigator.clipboard.writeText(summaryText);
    } catch {
      // Fallback: still show confirmation
    } finally {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold">
              KES {totalValue.toLocaleString()} unlocked, KES 0 borrowed
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-lg">
              This trade covers what you need using surplus you already have — no loan, no interest.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleCopySummary}>
              {copied ? <Check data-icon="inline-start" className="text-(--color-leaf-green)" /> : <Copy data-icon="inline-start" />}
              {copied ? 'Copied' : 'Share'}
            </Button>
            {onCommit && (
              <Button size="sm" onClick={() => onCommit(cycle.id)}>
                Commit to Trade
                <ArrowRight data-icon="inline-end" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 p-3 rounded-lg border">
            <span className="text-[11px] text-muted-foreground block font-medium">Value Unlocked</span>
            <span className="text-lg font-bold block mt-1">KES {totalValue.toLocaleString()}</span>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg border">
            <span className="text-[11px] text-muted-foreground block font-medium">Cash You Pay</span>
            <span className="text-lg font-bold block mt-1">KES 0</span>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg border">
            <span className="text-[11px] text-muted-foreground block font-medium">Loan Interest Avoided</span>
            <span className="text-lg font-bold block mt-1 text-(--color-leaf-green)">KES {interestAvoided.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
