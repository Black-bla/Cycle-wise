import React, { useState } from 'react';
import { Send, CheckCircle, ShieldAlert, Activity, Edit3, Check } from 'lucide-react';
import { guardrailCheckInput } from '../agent/guardrails';
import { StructuredExtraction, ExchangeCycle } from '../agent/types';
import { OrchestrationResult } from '../agent/geminiAgent';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';

interface TellCyclewiseSectionProps {
  onOrchestrationComplete?: (cycles: ExchangeCycle[]) => void;
}

export const TellCyclewiseSection: React.FC<TellCyclewiseSectionProps> = ({
  onOrchestrationComplete,
}) => {
  const [inputText, setInputText] = useState('');
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [guardrailError, setGuardrailError] = useState<string | null>(null);
  const [orchestrationResult, setOrchestrationResult] = useState<OrchestrationResult | null>(null);
  const [extraction, setExtraction] = useState<StructuredExtraction | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editNeedItem, setEditNeedItem] = useState('');
  const [editNeedQty, setEditNeedQty] = useState(1);
  const [editNeedUnit, setEditNeedUnit] = useState('');
  const [editOfferItem, setEditOfferItem] = useState('');
  const [editOfferQty, setEditOfferQty] = useState(1);
  const [editOfferUnit, setEditOfferUnit] = useState('');

  const samplePrompts = [
    {
      label: 'Mixed Swahili-English',
      text: 'Nahitaji cartons 20 za cooking oil by Friday Nairobi Eastleigh. Naweza kusaidia na quarterly bookkeeping wiki ijayo value about 18k.',
    },
    {
      label: 'Sheng',
      text: 'Niko na nduthi 5 za delivery Nairobi Westlands. Nahitaji mtu wa bookkeeping anisaidie na KRA returns za quarter hii.',
    },
    {
      label: 'English',
      text: 'Have 200 food-grade corrugated cartons available in Industrial Area. Need immediate dispatch courier to Eastleigh.',
    },
  ];

  const handleRunAgent = async () => {
    setGuardrailError(null);
    setIsOrchestrating(true);

    const check = guardrailCheckInput(inputText);
    if (!check.allowed) {
      setGuardrailError(`This request couldn't be processed: ${check.reason}`);
      setIsOrchestrating(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/agent/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputText }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const result: OrchestrationResult = await res.json();
      setOrchestrationResult(result);
      setExtraction(result.extraction);

      setEditNeedItem(result.extraction.need.item_or_service || '');
      setEditNeedQty(result.extraction.need.quantity || 1);
      setEditNeedUnit(result.extraction.need.unit || 'units');
      setEditOfferItem(result.extraction.offer.item_or_service || '');
      setEditOfferQty(result.extraction.offer.quantity || 1);
      setEditOfferUnit(result.extraction.offer.unit || 'units');

      if (onOrchestrationComplete) {
        onOrchestrationComplete(result.cycles);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong';
      console.error('Agent error:', errMsg);
      setGuardrailError(errMsg);
    } finally {
      setIsOrchestrating(false);
    }
  };

  const handleSaveEdits = () => {
    if (!extraction) return;
    const updated: StructuredExtraction = {
      ...extraction,
      need: {
        ...extraction.need,
        item_or_service: editNeedItem,
        quantity: Number(editNeedQty),
        unit: editNeedUnit,
      },
      offer: {
        ...extraction.offer,
        item_or_service: editOfferItem,
        quantity: Number(editOfferQty),
        unit: editOfferUnit,
      },
    };
    setExtraction(updated);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <h2 className="text-base font-bold">What does your business need? What can you offer?</h2>
          <p className="text-xs text-muted-foreground">
            Describe it in your own words — English, Kiswahili, or Sheng all work.
          </p>
        </div>

        {/* Scenario chips */}
        <div className="flex flex-wrap gap-1.5">
          {samplePrompts.map((p, idx) => (
            <Button
              key={idx}
              size="xs"
              variant="outline"
              onClick={() => {
                setInputText(p.text);
                setGuardrailError(null);
              }}
            >
              {p.label} example
            </Button>
          ))}
        </div>

        {/* Input textarea */}
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={3}
          placeholder="E.g., I need 20 cartons of cooking oil by Friday. I can offer bookkeeping help in return..."
        />

        {/* Guardrail rejection alert */}
        {guardrailError && (
          <Alert variant="destructive">
            <ShieldAlert />
            <AlertTitle>Couldn&apos;t process that request</AlertTitle>
            <AlertDescription>{guardrailError}</AlertDescription>
          </Alert>
        )}

        {/* Action button */}
        <div className="flex justify-end">
          <Button onClick={handleRunAgent} disabled={isOrchestrating || !inputText.trim()}>
            {isOrchestrating ? <Activity data-icon="inline-start" className="animate-spin" /> : <Send data-icon="inline-start" />}
            {isOrchestrating ? 'Finding your match...' : 'Find My Match'}
          </Button>
        </div>

        {/* Grounded Explanation */}
        {orchestrationResult?.explanation && (
          <Alert className="border-(--color-leaf-green)/30 bg-(--color-leaf-green)/5">
            <CheckCircle className="text-(--color-leaf-green)" />
            <AlertTitle>How this works for you</AlertTitle>
            <AlertDescription className="text-foreground">
              {orchestrationResult.explanation.summary}
            </AlertDescription>
          </Alert>
        )}

        {/* Extraction Preview & Review Panel */}
        {extraction && (
          <Card size="sm" className="bg-muted/40">
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b">
                <span className="text-xs font-bold">Here&apos;s what we understood</span>
                <Button size="xs" variant="outline" onClick={() => setIsEditing(!isEditing)}>
                  <Edit3 data-icon="inline-start" />
                  {isEditing ? 'Cancel' : 'Fix Something'}
                </Button>
              </div>

              {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <Card size="sm">
                    <CardContent>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-(--color-burnt-orange) block mb-1">
                        You need
                      </span>
                      <div className="space-y-1">
                        <div><strong>{extraction.need.item_or_service}</strong></div>
                        <div><span className="text-muted-foreground">Quantity: </span><strong>{extraction.need.quantity} {extraction.need.unit}</strong></div>
                        <div><span className="text-muted-foreground">By: </span><strong>{extraction.need.deadline || 'Flexible'}</strong></div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card size="sm">
                    <CardContent>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-(--color-leaf-green) block mb-1">
                        You offer
                      </span>
                      <div className="space-y-1">
                        <div><strong>{extraction.offer.item_or_service}</strong></div>
                        <div><span className="text-muted-foreground">Quantity: </span><strong>{extraction.offer.quantity} {extraction.offer.unit}</strong></div>
                        <div><span className="text-muted-foreground">Worth about: </span><strong>KES {extraction.offer.estimated_value?.toLocaleString()}</strong></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card size="sm">
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FieldGroup>
                      <span className="text-[10px] uppercase font-bold text-(--color-burnt-orange)">You need</span>
                      <Field>
                        <FieldLabel className="text-[10px] text-muted-foreground">Item / Service</FieldLabel>
                        <Input value={editNeedItem} onChange={(e) => setEditNeedItem(e.target.value)} />
                      </Field>
                      <div className="grid grid-cols-2 gap-2">
                        <Field>
                          <FieldLabel className="text-[10px] text-muted-foreground">Quantity</FieldLabel>
                          <Input type="number" value={editNeedQty} onChange={(e) => setEditNeedQty(Number(e.target.value))} />
                        </Field>
                        <Field>
                          <FieldLabel className="text-[10px] text-muted-foreground">Unit</FieldLabel>
                          <Input value={editNeedUnit} onChange={(e) => setEditNeedUnit(e.target.value)} />
                        </Field>
                      </div>
                    </FieldGroup>

                    <FieldGroup>
                      <span className="text-[10px] uppercase font-bold text-(--color-leaf-green)">You offer</span>
                      <Field>
                        <FieldLabel className="text-[10px] text-muted-foreground">Item / Service</FieldLabel>
                        <Input value={editOfferItem} onChange={(e) => setEditOfferItem(e.target.value)} />
                      </Field>
                      <div className="grid grid-cols-2 gap-2">
                        <Field>
                          <FieldLabel className="text-[10px] text-muted-foreground">Quantity</FieldLabel>
                          <Input type="number" value={editOfferQty} onChange={(e) => setEditOfferQty(Number(e.target.value))} />
                        </Field>
                        <Field>
                          <FieldLabel className="text-[10px] text-muted-foreground">Unit</FieldLabel>
                          <Input value={editOfferUnit} onChange={(e) => setEditOfferUnit(e.target.value)} />
                        </Field>
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" onClick={handleSaveEdits}>
                          <Check data-icon="inline-start" />
                          Save
                        </Button>
                      </div>
                    </FieldGroup>
                  </CardContent>
                </Card>
              )}

              <p className="text-[11px] text-muted-foreground pt-1">
                Nothing is final yet — every trade needs your approval before it happens.
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
