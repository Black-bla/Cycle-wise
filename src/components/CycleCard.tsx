import React from 'react';
import { ExchangeCycle, SMEProfile } from '../agent/types';
import { ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';

interface CycleCardProps {
  cycle: ExchangeCycle;
  smes: Map<string, SMEProfile>;
  onCommit?: (cycleId: string) => void;
  onDecline?: (cycleId: string) => void;
}

export const CycleCard: React.FC<CycleCardProps> = ({ cycle, smes, onCommit, onDecline }) => {
  const getSmeName = (id: string) => smes.get(id)?.name || id;
  const getSmeSector = (id: string) => smes.get(id)?.sector || 'SME';

  return (
    <div className="bg-white rounded-xl border border-[#E3E0D7] shadow-xs p-4 sm:p-5 transition-all hover:border-[#C4C0B4]">
      {/* Header with clean unboxed metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EFECE4]">
        <div className="flex items-center gap-2 text-xs text-[#68727D]">
          <span className="font-bold text-[#18243A] text-sm">{cycle.cycle_length}-Business Closed Loop</span>
          <span aria-hidden="true">&bull;</span>
          <span>Match Score: <strong className="text-[#18243A]">{(cycle.score_breakdown.final_score * 100).toFixed(0)}%</strong></span>
          <span aria-hidden="true">&bull;</span>
          <span>Status: <strong className="text-[#18243A]">{cycle.status}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#2E8B68] font-bold">
          <DollarSign className="w-3.5 h-3.5" />
          <span>KES {cycle.estimated_value_unlocked.toLocaleString()} Value Unlocked</span>
        </div>
      </div>

      {/* Cycle sequence loop illustration */}
      <div className="py-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#68727D] mb-2.5">
          Reciprocal Resource Flow (No Debt Incurred)
        </h4>

        <div className="space-y-2.5">
          {cycle.edges.map((edge, idx) => {
            const fromName = getSmeName(edge.from_sme_id);
            const toName = getSmeName(edge.to_sme_id);
            const fromSector = getSmeSector(edge.from_sme_id);

            return (
              <div
                key={edge.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-[#F7F5EF] border border-[#EBE7DC] gap-2 text-xs"
              >
                <div className="flex items-center space-x-2 min-w-[140px]">
                  <span className="w-5 h-5 rounded-full bg-[#18243A] text-white flex items-center justify-center font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-[#18243A] block">{fromName}</span>
                    <span className="text-[10px] text-[#68727D]">{fromSector}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-1 px-1">
                  <ArrowRight className="w-3.5 h-3.5 text-[#E7B84B] shrink-0" />
                  <div className="bg-white px-2 py-1 rounded-md border border-[#E3E0D7] text-[#17202A] font-medium flex-1">
                    Gives: <span className="text-[#18243A] font-semibold">{edge.item_or_service}</span>
                    <span className="text-[10px] text-[#68727D] ml-1">(~KES {edge.estimated_value.toLocaleString()})</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#E7B84B] shrink-0" />
                </div>

                <div className="min-w-[120px] text-right sm:text-right">
                  <span className="text-[11px] text-[#68727D]">to </span>
                  <span className="font-semibold text-[#18243A]">{toName}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Factor Score Breakdown */}
      <div className="mt-3 pt-3 border-t border-[#EFECE4] grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
        <div className="bg-[#F7F5EF] p-1.5 rounded-md">
          <span className="text-[10px] text-[#68727D] block">Compat (30%)</span>
          <span className="text-xs font-semibold text-[#18243A]">
            {(cycle.score_breakdown.compatibility * 100).toFixed(0)}%
          </span>
        </div>
        <div className="bg-[#F7F5EF] p-1.5 rounded-md">
          <span className="text-[10px] text-[#68727D] block">Quantity (20%)</span>
          <span className="text-xs font-semibold text-[#18243A]">
            {(cycle.score_breakdown.quantity_fit * 100).toFixed(0)}%
          </span>
        </div>
        <div className="bg-[#F7F5EF] p-1.5 rounded-md">
          <span className="text-[10px] text-[#68727D] block">Deadline (15%)</span>
          <span className="text-xs font-semibold text-[#18243A]">
            {(cycle.score_breakdown.deadline_fit * 100).toFixed(0)}%
          </span>
        </div>
        <div className="bg-[#F7F5EF] p-1.5 rounded-md">
          <span className="text-[10px] text-[#68727D] block">Location (15%)</span>
          <span className="text-xs font-semibold text-[#18243A]">
            {(cycle.score_breakdown.location_fit * 100).toFixed(0)}%
          </span>
        </div>
        <div className="bg-[#F7F5EF] p-1.5 rounded-md">
          <span className="text-[10px] text-[#68727D] block">Trust Ev (10%)</span>
          <span className="text-xs font-semibold text-[#18243A]">
            {(cycle.score_breakdown.trust_evidence * 100).toFixed(0)}%
          </span>
        </div>
        <div className="bg-[#F7F5EF] p-1.5 rounded-md">
          <span className="text-[10px] text-[#68727D] block">Balance (10%)</span>
          <span className="text-xs font-semibold text-[#18243A]">
            {(cycle.score_breakdown.value_balance * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Risk and Human Consent Warning */}
      {cycle.risk_flags.length > 0 && (
        <div className="mt-3 p-2 rounded-md bg-[#FFF7ED] border border-[#FDBA74]/40 flex items-start space-x-2 text-xs text-[#9A3412]">
          <AlertTriangle className="w-4 h-4 text-[#D8783D] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Review note: </span>
            {cycle.risk_flags.join('. ')}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-[#EFECE4] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 text-xs text-[#68727D]">
          <ShieldCheck className="w-4 h-4 text-[#2E8B68]" />
          <span>Status: <strong>{cycle.status}</strong> (Pending 4 human confirmations)</span>
        </div>

        <div className="flex items-center space-x-2">
          {onDecline && (
            <button
              onClick={() => onDecline(cycle.id)}
              className="px-3 py-1.5 rounded-md border border-[#E3E0D7] text-xs font-medium text-[#68727D] hover:bg-[#F7F5EF] transition-colors"
            >
              Simulate Decline
            </button>
          )}
          {onCommit && (
            <button
              onClick={() => onCommit(cycle.id)}
              className="px-4 py-1.5 rounded-md bg-[#18243A] hover:bg-[#253752] text-xs font-semibold text-[#E7B84B] transition-colors flex items-center space-x-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Review & Commit Proposal</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
