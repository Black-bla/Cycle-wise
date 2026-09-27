import React from 'react';
import { SMEProfile } from '../agent/types';
import { ShieldCheck, CheckCircle2, Clock, AlertTriangle, Building2, MapPin } from 'lucide-react';

interface EvidencePanelProps {
  smes: SMEProfile[];
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ smes }) => {
  return (
    <div className="bg-white rounded-xl border border-[#E3E0D7] p-4 sm:p-6 shadow-xs mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-[#EFECE4] flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-[#18243A] text-[#2E8B68]">
            <ShieldCheck className="w-5 h-5 text-[#2E8B68]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#18243A]">Transparent Trust & Evidence Ledger</h2>
            <p className="text-xs text-[#68727D]">
              Objective transaction events and identity confirmations &bull; No black-box credit scores
            </p>
          </div>
        </div>

        <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#EAF5F0] text-[#2E8B68] font-semibold border border-[#2E8B68]/30">
          Responsible AI Trust Model
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {smes.map((sme) => {
          const completedCount = sme.trust_events.filter((e) => e.event_type === 'completed_exchange').length;
          const lateCount = sme.trust_events.filter((e) => e.event_type === 'late_delivery').length;

          return (
            <div key={sme.id} className="p-4 rounded-xl border border-[#EBE7DC] bg-[#F7F5EF] space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#18243A]">{sme.name}</h3>
                  <div className="flex items-center space-x-2 text-xs text-[#68727D] mt-0.5">
                    <span className="flex items-center space-x-1">
                      <Building2 className="w-3 h-3" />
                      <span>{sme.sector}</span>
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{sme.location}</span>
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    sme.identity_status === 'verified'
                      ? 'bg-[#EAF5F0] text-[#2E8B68] border-[#2E8B68]/30'
                      : 'bg-[#FFF7ED] text-[#D8783D] border-[#FDBA74]'
                  }`}
                >
                  {sme.identity_status === 'verified' ? 'Identity Verified' : 'Unverified Identity'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center text-xs py-1">
                <div className="bg-white p-1.5 rounded-md border border-[#E3E0D7]">
                  <span className="text-[10px] text-[#68727D] block">Exchanges</span>
                  <span className="font-bold text-[#18243A]">{completedCount} Completed</span>
                </div>
                <div className="bg-white p-1.5 rounded-md border border-[#E3E0D7]">
                  <span className="text-[10px] text-[#68727D] block">Disputes</span>
                  <span className="font-bold text-[#2E8B68]">0 Unresolved</span>
                </div>
                <div className="bg-white p-1.5 rounded-md border border-[#E3E0D7]">
                  <span className="text-[10px] text-[#68727D] block">Delivery</span>
                  <span className="font-bold text-[#18243A]">
                    {lateCount > 0 ? `${lateCount} Late (Resolved)` : '100% On-time'}
                  </span>
                </div>
              </div>

              {/* Event details list */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#68727D] block">
                  Recorded Evidence Events
                </span>
                {sme.trust_events.map((evt) => (
                  <div key={evt.id} className="text-[11px] flex items-start space-x-1.5 text-[#17202A]">
                    {evt.outcome === 'confirmed' || evt.outcome === 'verified' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2E8B68] shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-[#D8783D] shrink-0 mt-0.5" />
                    )}
                    <span>{evt.evidence_text}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
