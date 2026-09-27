import React from 'react';
import { ExchangeCycle, SMEProfile } from '../agent/types';
import { CheckCircle2, Clock, AlertTriangle, Shield, UserCheck, RefreshCw } from 'lucide-react';

interface ExchangesTrackerProps {
  cycles: ExchangeCycle[];
  smes: Map<string, SMEProfile>;
  onCommitAll: (cycleId: string) => void;
  onSimulateDecline: (cycleId: string) => void;
  onReset: () => void;
}

export const ExchangesTracker: React.FC<ExchangesTrackerProps> = ({
  cycles,
  smes,
  onCommitAll,
  onSimulateDecline,
  onReset,
}) => {
  const activeCycle = cycles[0];

  const steps = [
    { label: 'Proposed', done: true },
    { label: 'Partially Committed', done: activeCycle?.status !== 'Proposed' },
    { label: 'All Committed (Active)', done: activeCycle?.status === 'Active' || activeCycle?.status === 'In progress' },
    { label: 'Delivered', done: false },
    { label: 'Confirmed Complete', done: false },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#E3E0D7] p-4 sm:p-6 shadow-xs mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-[#EFECE4] flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-[#18243A] text-[#E7B84B]">
            <Clock className="w-5 h-5 text-[#E7B84B]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#18243A]">Multi-Business Exchange Lifecycle Tracker</h2>
            <p className="text-xs text-[#68727D]">
              Requires unanimous consent across all participants before chain activation
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-[#E3E0D7] text-xs font-medium text-[#68727D] hover:bg-[#F7F5EF] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Tracker State</span>
        </button>
      </div>

      {activeCycle ? (
        <div className="mt-4 space-y-4">
          {/* Timeline stepper */}
          <div className="p-4 rounded-xl bg-[#F7F5EF] border border-[#EBE7DC]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#68727D] block mb-3">
              Exchange State Timeline &bull; Current: <span className="text-[#18243A]">{activeCycle.status}</span>
            </span>

            <div className="flex flex-wrap items-center justify-between gap-2">
              {steps.map((st, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      st.done
                        ? 'bg-[#2E8B68] text-white'
                        : 'bg-[#E3E0D7] text-[#68727D]'
                    }`}
                  >
                    {st.done ? '✓' : i + 1}
                  </div>
                  <span
                    className={`text-xs ${
                      st.done ? 'font-bold text-[#18243A]' : 'text-[#68727D]'
                    }`}
                  >
                    {st.label}
                  </span>
                  {i < steps.length - 1 && <span className="text-[#A6B2C3] hidden sm:inline">&rarr;</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Participant Commitments Grid */}
          <div className="p-4 rounded-xl border border-[#E3E0D7] bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#68727D] mb-3">
              Participant Commitments ({activeCycle.cycle_length} Required)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {activeCycle.sme_sequence.map((smeId) => {
                const sme = smes.get(smeId);
                const isCommitted = activeCycle.status === 'Active' || activeCycle.status === 'In progress';

                return (
                  <div key={smeId} className="p-3 rounded-lg border border-[#E3E0D7] bg-[#F7F5EF] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#18243A]">{sme?.name || smeId}</span>
                      <UserCheck className="w-3.5 h-3.5 text-[#2E8B68]" />
                    </div>
                    <span className="text-[10px] text-[#68727D] block">{sme?.sector}</span>

                    <div className="pt-1.5 border-t border-[#E3E0D7] flex items-center space-x-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isCommitted ? 'bg-[#2E8B68]' : 'bg-[#E7B84B] animate-pulse'
                        }`}
                      ></span>
                      <span className="text-[11px] font-semibold text-[#18243A]">
                        {isCommitted ? 'Committed & Approved' : 'Reviewing Terms'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Simulation CTA */}
            <div className="mt-4 pt-3 border-t border-[#EFECE4] flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-[#68727D]">
                Interactive Hackathon Demonstration Controls:
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onSimulateDecline(activeCycle.id)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#D8783D] text-[#D8783D] hover:bg-[#FFF7ED] text-xs font-semibold transition-colors"
                >
                  Simulate Participant Decline (Broken Chain)
                </button>
                <button
                  onClick={() => onCommitAll(activeCycle.id)}
                  className="px-4 py-1.5 rounded-lg bg-[#2E8B68] hover:bg-[#257356] text-white text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simulate All 4 SMEs Committing</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 p-8 text-center bg-[#F7F5EF] rounded-xl border border-[#EBE7DC]">
          <p className="text-sm text-[#68727D]">No active exchange selected yet. Run matching on the Network or Matches tab.</p>
        </div>
      )}
    </div>
  );
};
