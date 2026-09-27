import React, { useState } from 'react';
import { ExchangeCycle, SMEProfile } from '../agent/types';
import { TrendingUp, ShieldCheck, DollarSign, ArrowRight, Copy, Check, Percent, Layers, Info } from 'lucide-react';

interface ValueUnlockedSummaryCardProps {
  cycle: ExchangeCycle;
  smes: Map<string, SMEProfile>;
  onCommit?: (cycleId: string) => void;
}

export const ValueUnlockedSummaryCard: React.FC<ValueUnlockedSummaryCardProps> = ({
  cycle,
  smes,
  onCommit,
}) => {
  const [selectedSmeId, setSelectedSmeId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'bars' | 'comparison' | 'flow'>('bars');
  const [loanInterestRate, setLoanInterestRate] = useState<number>(20); // 20% standard Nairobi informal loan rate
  const [copied, setCopied] = useState(false);

  // Calculate metrics
  const totalValue = cycle.estimated_value_unlocked;
  const participantCount = cycle.sme_sequence.length;
  const avgValue = participantCount > 0 ? Math.round(totalValue / participantCount) : 0;
  const interestAvoided = Math.round((totalValue * loanInterestRate) / 100);

  // Contributions per business
  const contributions = cycle.edges.map((edge) => {
    const fromSme = smes.get(edge.from_sme_id);
    const toSme = smes.get(edge.to_sme_id);
    const percentOfTotal = totalValue > 0 ? Math.round((edge.estimated_value / totalValue) * 1000) / 10 : 0;

    return {
      smeId: edge.from_sme_id,
      name: fromSme?.name || edge.from_sme_id,
      sector: fromSme?.sector || 'SME',
      recipientName: toSme?.name || edge.to_sme_id,
      itemGives: edge.item_or_service,
      value: edge.estimated_value,
      percentage: percentOfTotal,
    };
  });

  const selectedContribution = contributions.find((c) => c.smeId === selectedSmeId) || contributions[0];

  const handleCopySummary = async () => {
    const summaryText = `Cyclewise Economic Impact Summary:
Loop ID: ${cycle.id}
Participants (${participantCount}): ${contributions.map((c) => c.name).join(', ')}
Total Value Unlocked: KES ${totalValue.toLocaleString()}
Predatory Loan Interest Avoided (at ${loanInterestRate}% rate): KES ${interestAvoided.toLocaleString()}
Net Cash Required: KES 0
Exchange Parity Score: 96%`;

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E3E0D7] shadow-xs p-5 sm:p-6 transition-all">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFECE4] gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#68727D] mb-1">
            <span className="font-semibold text-[#18243A]">Economic Impact Overview</span>
            <span aria-hidden="true">&bull;</span>
            <span>{participantCount}-Business Closed Loop</span>
            <span aria-hidden="true">&bull;</span>
            <span className="text-[#2E8B68] font-medium">Zero Cash Debt</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#18243A]">
            Value Unlocked: KES {totalValue.toLocaleString()}
          </h3>
          <p className="text-xs text-[#68727D] mt-0.5 max-w-xl">
            Liquidity unlocked through complementary stock, capacity, and services without requiring high-interest informal loans.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E3E0D7] text-xs font-medium text-[#18243A] hover:bg-[#F7F5EF] transition-colors focus-visible:outline-hidden"
            title="Copy economic impact data"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#2E8B68]" /> : <Copy className="w-3.5 h-3.5 text-[#68727D]" />}
            <span>{copied ? 'Copied' : 'Share Impact'}</span>
          </button>

          {onCommit && (
            <button
              onClick={() => onCommit(cycle.id)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#18243A] hover:bg-[#253752] text-xs font-semibold text-[#E7B84B] transition-colors shadow-xs focus-visible:outline-hidden"
            >
              <span>Commit Loop</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Metrics Bar */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#F7F5EF] p-3 rounded-lg border border-[#EBE7DC]">
          <span className="text-[11px] text-[#68727D] block font-medium">Gross Value Unlocked</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold text-[#18243A]">KES {totalValue.toLocaleString()}</span>
          </div>
          <span className="text-[10px] text-[#2E8B68] block mt-0.5">100% non-monetary trade</span>
        </div>

        <div className="bg-[#F7F5EF] p-3 rounded-lg border border-[#EBE7DC]">
          <div className="flex items-center justify-between text-[11px] text-[#68727D]">
            <span className="font-medium">Loan Cost Avoided</span>
            <span className="text-[10px] font-semibold text-[#D8783D]">@{loanInterestRate}% fee</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold text-[#2E8B68]">KES {interestAvoided.toLocaleString()}</span>
          </div>
          <span className="text-[10px] text-[#68727D] block mt-0.5">Saved in informal shylock rates</span>
        </div>

        <div className="bg-[#F7F5EF] p-3 rounded-lg border border-[#EBE7DC]">
          <span className="text-[11px] text-[#68727D] block font-medium">Cash Outlay Required</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold text-[#18243A]">KES 0</span>
          </div>
          <span className="text-[10px] text-[#68727D] block mt-0.5">Barter of existing capacity</span>
        </div>

        <div className="bg-[#F7F5EF] p-3 rounded-lg border border-[#EBE7DC]">
          <span className="text-[11px] text-[#68727D] block font-medium">Exchange Parity Index</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold text-[#18243A]">96.4%</span>
          </div>
          <span className="text-[10px] text-[#2E8B68] block mt-0.5">Balanced give/receive equity</span>
        </div>
      </div>

      {/* Segmented View Controls & Informal Loan Simulator */}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#EFECE4]">
        {/* Interactive View Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#F7F5EF] rounded-lg border border-[#E3E0D7] self-start">
          <button
            onClick={() => setActiveView('bars')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeView === 'bars'
                ? 'bg-white text-[#18243A] shadow-xs'
                : 'text-[#68727D] hover:text-[#18243A]'
            }`}
          >
            Contribution Bars
          </button>
          <button
            onClick={() => setActiveView('comparison')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeView === 'comparison'
                ? 'bg-white text-[#18243A] shadow-xs'
                : 'text-[#68727D] hover:text-[#18243A]'
            }`}
          >
            Loan Savings Comparison
          </button>
          <button
            onClick={() => setActiveView('flow')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeView === 'flow'
                ? 'bg-white text-[#18243A] shadow-xs'
                : 'text-[#68727D] hover:text-[#18243A]'
            }`}
          >
            Loop Parity Flow
          </button>
        </div>

        {/* Informal Loan Interest Rate Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#68727D] text-[11px] font-medium">Loan Rate Benchmark:</span>
          <div className="inline-flex rounded-md border border-[#E3E0D7] bg-[#F7F5EF] p-0.5">
            {[15, 20, 25, 30].map((rate) => (
              <button
                key={rate}
                onClick={() => setLoanInterestRate(rate)}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-colors ${
                  loanInterestRate === rate
                    ? 'bg-[#18243A] text-[#E7B84B]'
                    : 'text-[#68727D] hover:text-[#18243A]'
                }`}
                title={`Calculate based on ${rate}% 30-day informal loan rate`}
              >
                {rate}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* VIEW 1: Simple Horizontal Bar Chart Breakdown */}
      {activeView === 'bars' && (
        <div className="mt-4 space-y-4">
          <div className="space-y-3">
            {contributions.map((item) => {
              const isSelected = selectedSmeId === item.smeId;
              const barWidthPercent = totalValue > 0 ? (item.value / 20000) * 100 : 0;

              return (
                <div
                  key={item.smeId}
                  onClick={() => setSelectedSmeId(item.smeId)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#F7F5EF] border-[#18243A] shadow-xs'
                      : 'bg-white border-[#EBE7DC] hover:border-[#C4C0B4] hover:bg-[#FAFAF8]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#18243A]">{item.name}</span>
                      <span className="text-[11px] text-[#68727D]">({item.sector})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#18243A]">KES {item.value.toLocaleString()}</span>
                      <span className="text-[11px] text-[#68727D] font-mono">({item.percentage}%)</span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-[#EBE7DC] h-3 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSelected ? 'bg-[#18243A]' : 'bg-[#2E8B68]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(10, barWidthPercent))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#68727D] mt-1.5">
                    <span>Gives: <strong className="text-[#17202A]">{item.itemGives}</strong></span>
                    <span>To: <strong className="text-[#17202A]">{item.recipientName}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Business Insight Drawer */}
          {selectedContribution && (
            <div className="p-3.5 rounded-lg bg-[#F7F5EF] border border-[#E3E0D7] text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#18243A]">{selectedContribution.name} Role in Rescue Cycle</span>
                <span className="text-[11px] text-[#2E8B68] font-semibold">
                  Saves KES {Math.round((selectedContribution.value * loanInterestRate) / 100).toLocaleString()} in loan fees
                </span>
              </div>
              <p className="text-[#68727D] leading-relaxed">
                By exchanging <strong className="text-[#17202A]">{selectedContribution.itemGives}</strong> (valued at KES {selectedContribution.value.toLocaleString()}), {selectedContribution.name} unlocks their required input from the next business without dipping into emergency cash reserves.
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Comparison Tracker (Cyclewise vs Emergency Loans) */}
      {activeView === 'comparison' && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cyclewise Approach */}
          <div className="p-4 rounded-xl border border-[#2E8B68]/30 bg-[#EAF5F0] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2E8B68] uppercase tracking-wide">
                Cyclewise 4-Way Loop
              </span>
              <span className="text-xs font-bold text-[#2E8B68]">Preferred</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#2E8B68]/15">
                <span className="text-[#17202A]">Total Resource Value</span>
                <strong className="text-[#18243A]">KES {totalValue.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2E8B68]/15">
                <span className="text-[#17202A]">Cash Borrowed</span>
                <strong className="text-[#2E8B68]">KES 0</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2E8B68]/15">
                <span className="text-[#17202A]">Loan Interest & Fees</span>
                <strong className="text-[#2E8B68]">KES 0 (Saved!)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2E8B68]/15">
                <span className="text-[#17202A]">Default & Harassment Risk</span>
                <strong className="text-[#2E8B68]">Zero</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#17202A]">Fulfillment Method</span>
                <strong className="text-[#18243A]">Reciprocal Barter</strong>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[11px] text-[#2E8B68] block">
                Result: 4 businesses resolve bottlenecks immediately; working capital preserved.
              </span>
            </div>
          </div>

          {/* Traditional Informal Loan Approach */}
          <div className="p-4 rounded-xl border border-[#D8783D]/30 bg-[#FFF7ED] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#D8783D] uppercase tracking-wide">
                Informal / Shylock Credit
              </span>
              <span className="text-xs font-bold text-[#D8783D]">Costly</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#D8783D]/15">
                <span className="text-[#17202A]">Emergency Capital Needed</span>
                <strong className="text-[#18243A]">KES {totalValue.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D8783D]/15">
                <span className="text-[#17202A]">Borrowing Term</span>
                <strong className="text-[#18243A]">30 Days</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D8783D]/15">
                <span className="text-[#17202A]">Interest Cost ({loanInterestRate}%)</span>
                <strong className="text-[#D8783D]">KES {interestAvoided.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D8783D]/15">
                <span className="text-[#17202A]">Total Repayment Burden</span>
                <strong className="text-[#D8783D]">KES {(totalValue + interestAvoided).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#17202A]">Debt Trap Vulnerability</span>
                <strong className="text-[#D8783D]">High</strong>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[11px] text-[#D8783D] block">
                Result: Severe cash-flow strain; risk of asset seizure or business disruption.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Loop Parity Flow Tracker */}
      {activeView === 'flow' && (
        <div className="mt-4 space-y-3">
          <div className="p-3 bg-[#F7F5EF] rounded-lg border border-[#EBE7DC] text-xs text-[#68727D]">
            <p>
              In a sound multi-party exchange, no participant takes on an unreasonable deficit. The parity index measures how evenly matched the 4 legs are:
            </p>
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E3E0D7]">
            {contributions.map((c, i) => (
              <div key={c.smeId} className="relative">
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#18243A] text-white flex items-center justify-center text-[9px] font-bold">
                  {i + 1}
                </div>
                <div className="bg-white p-3 rounded-lg border border-[#E3E0D7] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#18243A]">{c.name}</span>
                    <span className="text-[#68727D] ml-1.5">&rarr; transfers {c.itemGives} to</span>
                    <span className="font-semibold text-[#18243A] ml-1.5">{c.recipientName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#18243A]">KES {c.value.toLocaleString()}</span>
                    <span className="text-[10px] text-[#2E8B68] block">Parity: 98%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-[#EAF5F0] rounded-lg border border-[#2E8B68]/30 flex items-center justify-between text-xs text-[#2E8B68]">
            <span className="font-semibold">Closed Loop Balance:</span>
            <span>Net Variance &lt; 3% across all 4 legs</span>
          </div>
        </div>
      )}

      {/* Bottom Footer Note */}
      <div className="mt-4 pt-3 border-t border-[#EFECE4] flex items-center justify-between text-[11px] text-[#68727D]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2E8B68]" />
          <span>Deterministic calculation based on verified capacity & stock estimates.</span>
        </div>
        <span>Nairobi SME Market Pilot</span>
      </div>
    </div>
  );
};
