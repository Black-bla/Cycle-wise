import React from 'react';
import { SMEProfile } from '../agent/types';
import { ShieldCheck, CheckCircle2, AlertTriangle, Building2, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EvidencePanelProps {
  smes: SMEProfile[];
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ smes }) => {
  return (
    <Card className="mb-6">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary text-(--color-leaf-green)">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Transparent Trust &amp; Evidence Ledger</h2>
              <p className="text-xs text-muted-foreground">
                Objective transaction events and identity confirmations &bull; No black-box credit scores
              </p>
            </div>
          </div>

          <Badge variant="outline" className="border-(--color-leaf-green)/30 bg-(--color-leaf-green)/10 text-(--color-leaf-green)">
            Responsible AI Trust Model
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {smes.map((sme) => {
            const completedCount = sme.trust_events.filter((e) => e.event_type === 'completed_exchange').length;
            const lateCount = sme.trust_events.filter((e) => e.event_type === 'late_delivery').length;

            return (
              <Card key={sme.id} size="sm" className="bg-muted/40">
                <CardContent className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold">{sme.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Building2 className="size-3" />
                          <span>{sme.sector}</span>
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          <span>{sme.location}</span>
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={
                        sme.identity_status === 'verified'
                          ? 'border-(--color-leaf-green)/30 bg-(--color-leaf-green)/10 text-(--color-leaf-green)'
                          : 'border-(--color-burnt-orange)/40 bg-(--color-burnt-orange)/10 text-(--color-burnt-orange)'
                      }
                    >
                      {sme.identity_status === 'verified' ? 'Identity Verified' : 'Unverified Identity'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs py-1">
                    <div className="bg-background p-1.5 rounded-md border">
                      <span className="text-[10px] text-muted-foreground block">Exchanges</span>
                      <span className="font-bold">{completedCount} Completed</span>
                    </div>
                    <div className="bg-background p-1.5 rounded-md border">
                      <span className="text-[10px] text-muted-foreground block">Disputes</span>
                      <span className="font-bold text-(--color-leaf-green)">0 Unresolved</span>
                    </div>
                    <div className="bg-background p-1.5 rounded-md border">
                      <span className="text-[10px] text-muted-foreground block">Delivery</span>
                      <span className="font-bold">
                        {lateCount > 0 ? `${lateCount} Late (Resolved)` : '100% On-time'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Recorded Evidence Events
                    </span>
                    {sme.trust_events.map((evt) => (
                      <div key={evt.id} className="text-[11px] flex items-start gap-1.5">
                        {evt.outcome === 'confirmed' || evt.outcome === 'verified' ? (
                          <CheckCircle2 className="size-3.5 text-(--color-leaf-green) shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="size-3.5 text-(--color-burnt-orange) shrink-0 mt-0.5" />
                        )}
                        <span>{evt.evidence_text}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
