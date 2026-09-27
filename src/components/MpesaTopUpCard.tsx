import React, { useEffect, useRef, useState } from 'react';
import { ExchangeCycle, SMEProfile } from '../agent/types';
import { Smartphone, Send, CheckCircle2, XCircle, Loader2, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

interface MpesaTopUpCardProps {
  cycle: ExchangeCycle;
  smes: Map<string, SMEProfile>;
}

type FlowState = 'idle' | 'sending' | 'pending' | 'completed' | 'failed';

const KENYAN_PHONE_RE = /^(?:\+?254|0)?7\d{8}$/;

export const MpesaTopUpCard: React.FC<MpesaTopUpCardProps> = ({ cycle, smes }) => {
  const payerSme = smes.get(cycle.sme_sequence[0]);
  const suggestedGap = Math.max(
    1,
    Math.round(cycle.estimated_value_unlocked * (1 - cycle.score_breakdown.value_balance))
  );

  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState<number>(suggestedGap);
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLive, setIsLive] = useState<boolean | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttempts = useRef(0);

  useEffect(() => {
    fetch('/api/v1/health')
      .then((r) => r.json())
      .then((d) => setIsLive(Boolean(d?.providers?.payment?.is_live)))
      .catch(() => setIsLive(null));

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const pollStatus = (checkoutRequestId: string) => {
    pollAttempts.current = 0;
    pollRef.current = setInterval(async () => {
      pollAttempts.current += 1;
      try {
        const res = await fetch(`/api/v1/mpesa/status/${checkoutRequestId}`);
        const data = await res.json();

        if (data.status === 'completed') {
          setFlowState('completed');
          setReceiptNumber(data.mpesa_receipt_number || null);
          setStatusMessage(data.result_desc || 'Payment confirmed.');
          stopPolling();
        } else if (data.status === 'failed') {
          setFlowState('failed');
          setErrorMsg(data.result_desc || 'Payment was not completed.');
          stopPolling();
        }
      } catch {
        // transient network error while polling; keep trying until timeout
      }

      if (pollAttempts.current >= 20) {
        stopPolling();
        setFlowState((prev) => {
          if (prev === 'pending') {
            setErrorMsg('Timed out waiting for confirmation. Check your phone and try again.');
            return 'failed';
          }
          return prev;
        });
      }
    }, 3000);
  };

  const handleSendStkPush = async () => {
    setErrorMsg(null);
    setReceiptNumber(null);
    setStatusMessage(null);

    if (!KENYAN_PHONE_RE.test(phoneNumber.trim())) {
      setErrorMsg('Enter a valid Kenyan phone number, e.g. 07XXXXXXXX or 2547XXXXXXXX.');
      return;
    }
    if (!amount || amount <= 0) {
      setErrorMsg('Enter a top-up amount greater than KES 0.');
      return;
    }

    setFlowState('sending');
    try {
      const res = await fetch('/api/v1/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber.trim(),
          amount,
          cycle_id: cycle.id,
          sme_id: cycle.sme_sequence[0],
          account_reference: cycle.id.slice(0, 12),
          transaction_desc: 'Cyclewise top-up',
        }),
      });
      const data = await res.json();
      setIsLive(Boolean(data.is_live));

      if (!data.success || !data.checkout_request_id) {
        setFlowState('failed');
        setErrorMsg(data.error || data.customer_message || 'Could not initiate STK Push.');
        return;
      }

      setFlowState('pending');
      setStatusMessage(data.customer_message);
      pollStatus(data.checkout_request_id);
    } catch (err: unknown) {
      setFlowState('failed');
      setErrorMsg(err instanceof Error ? err.message : 'STK Push request failed');
    }
  };

  const handleReset = () => {
    stopPolling();
    setFlowState('idle');
    setStatusMessage(null);
    setErrorMsg(null);
    setReceiptNumber(null);
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Smartphone className="size-4 text-(--color-leaf-green)" />
              <span>Optional Value-Balance Top-Up (M-Pesa)</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-lg">
              This loop is {(cycle.score_breakdown.value_balance * 100).toFixed(0)}% value-balanced through barter alone.
              The remaining KES {suggestedGap.toLocaleString()} sliver can be settled same-day via M-Pesa —
              paid in full immediately, never carried as debt.
            </p>
          </div>
          {isLive !== null && (
            <Badge variant={isLive ? 'default' : 'outline'} className="shrink-0 gap-1">
              <ShieldCheck className="size-3" />
              {isLive ? 'Live Daraja Sandbox' : 'Simulated (no MPESA_* keys set)'}
            </Badge>
          )}
        </div>

        {flowState === 'completed' ? (
          <Alert className="border-(--color-leaf-green)/30 bg-(--color-leaf-green)/5">
            <CheckCircle2 className="text-(--color-leaf-green)" />
            <AlertTitle>Top-up confirmed</AlertTitle>
            <AlertDescription>
              KES {amount.toLocaleString()} received from {phoneNumber}.
              {receiptNumber && (
                <span className="block font-mono text-[11px] mt-1">M-Pesa Receipt: {receiptNumber}</span>
              )}
              <Button size="sm" variant="outline" className="mt-2" onClick={handleReset}>
                Send Another
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <FieldGroup>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="mpesa-phone">Phone Number (Safaricom)</FieldLabel>
                <Input
                  id="mpesa-phone"
                  type="tel"
                  placeholder={payerSme ? `e.g. 07XX XXX XXX for ${payerSme.name}` : '07XXXXXXXX'}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={flowState === 'sending' || flowState === 'pending'}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="mpesa-amount">Top-Up Amount (KES)</FieldLabel>
                <Input
                  id="mpesa-amount"
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  disabled={flowState === 'sending' || flowState === 'pending'}
                />
              </Field>
            </div>

            {errorMsg && (
              <Alert variant="destructive">
                <XCircle />
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            {flowState === 'pending' && (
              <Alert>
                <Loader2 className="animate-spin" />
                <AlertTitle>Check your phone</AlertTitle>
                <AlertDescription>
                  {statusMessage || 'An M-Pesa PIN prompt was sent. Waiting for confirmation…'}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <FieldDescription>
                Sandbox mode uses Safaricom&apos;s public test shortcode — no real money moves unless
                MPESA_ENV is set to production with your own credentials.
              </FieldDescription>
              <Button
                onClick={handleSendStkPush}
                disabled={flowState === 'sending' || flowState === 'pending'}
                className="shrink-0"
              >
                {flowState === 'sending' || flowState === 'pending' ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Send data-icon="inline-start" />
                )}
                {flowState === 'pending' ? 'Awaiting Confirmation…' : 'Send STK Push'}
              </Button>
            </div>
          </FieldGroup>
        )}
      </CardContent>
    </Card>
  );
};
