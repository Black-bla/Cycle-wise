/**
 * Provider-Agnostic Integration Architecture
 * Abstract interfaces and resilient Mock Adapters for SMS, Identity, Logistics,
 * Webhooks, and Notifications.
 */

export interface NotificationPayload {
  recipientId: string;
  channel: 'sms' | 'whatsapp' | 'in_app';
  message: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface NotificationResult {
  success: boolean;
  messageId: string;
  timestamp: string;
  provider: string;
}

export interface NotificationProvider {
  name: string;
  send(payload: NotificationPayload): Promise<NotificationResult>;
  healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'outage'; latencyMs: number }>;
}

export interface IdentityVerifyRequest {
  businessId: string;
  registrationNumber?: string;
  directorName?: string;
}

export interface IdentityVerifyResult {
  verified: boolean;
  status: 'verified' | 'unverified' | 'flagged';
  evidenceRef: string;
  timestamp: string;
}

export interface IdentityProvider {
  name: string;
  verify(request: IdentityVerifyRequest): Promise<IdentityVerifyResult>;
  healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'outage'; latencyMs: number }>;
}

export interface LogisticsQuoteRequest {
  origin: string;
  destination: string;
  packageWeightKg?: number;
  perishable?: boolean;
}

export interface LogisticsQuoteResult {
  providerName: string;
  feasible: boolean;
  estimatedTransitMinutes: number;
  carrierType: 'motorcycle_courier' | 'van' | 'walking';
}

export interface LogisticsProvider {
  name: string;
  quote(request: LogisticsQuoteRequest): Promise<LogisticsQuoteResult>;
}

// -------------------------------------------------------------
// Payment Provider (M-Pesa Daraja) — Optional Balance Top-Up
// -------------------------------------------------------------
// Cyclewise cycles are barter-first and usually settle 90-100% of value
// through reciprocal exchange; the remaining sliver (the "value balance"
// gap) can optionally be closed same-day via M-Pesa STK Push instead of
// a cash loan. This is a same-transaction top-up, never a line of credit.

export interface StkPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

export interface StkPushInitiateResult {
  success: boolean;
  provider: string;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  customerMessage: string;
  responseCode?: string;
  error?: string;
}

export type StkPushState = 'pending' | 'completed' | 'failed' | 'not_found';

export interface StkPushStatusResult {
  state: StkPushState;
  resultCode?: number;
  resultDesc?: string;
  mpesaReceiptNumber?: string;
  amount?: number;
  phoneNumber?: string;
  transactionDate?: string;
}

export interface PaymentProvider {
  name: string;
  isLive: boolean;
  initiateStkPush(request: StkPushRequest): Promise<StkPushInitiateResult>;
  queryStkPushStatus(checkoutRequestId: string): Promise<StkPushStatusResult>;
  healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'outage'; latencyMs: number }>;
}

// -------------------------------------------------------------
// Mock Implementation (Production-ready interface simulation)
// -------------------------------------------------------------

export class MockNotificationProvider implements NotificationProvider {
  name = 'MockAfricaSMS';

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    // Simulated network delay
    await new Promise((r) => setTimeout(r, 60));
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      provider: this.name,
    };
  }

  async healthCheck() {
    return { status: 'healthy' as const, latencyMs: 38 };
  }
}

export class MockIdentityProvider implements IdentityProvider {
  name = 'MockNationalBusinessRegistry';

  async verify(request: IdentityVerifyRequest): Promise<IdentityVerifyResult> {
    await new Promise((r) => setTimeout(r, 80));
    const isVerified = request.businessId !== 'sme-unregistered';
    return {
      verified: isVerified,
      status: isVerified ? 'verified' : 'unverified',
      evidenceRef: `brn_ke_${request.businessId.replace(/[^a-zA-Z0-9]/g, '')}`,
      timestamp: new Date().toISOString(),
    };
  }

  async healthCheck() {
    return { status: 'healthy' as const, latencyMs: 45 };
  }
}

export class MockLogisticsProvider implements LogisticsProvider {
  name = 'MockSwiftCouriersAdapter';

  async quote(request: LogisticsQuoteRequest): Promise<LogisticsQuoteResult> {
    return {
      providerName: this.name,
      feasible: true,
      estimatedTransitMinutes: 45,
      carrierType: 'motorcycle_courier',
    };
  }
}

/**
 * Simulated M-Pesa provider used automatically when Daraja credentials are
 * not configured, so the balance-top-up flow stays fully demoable with zero
 * setup. Mirrors the shape of a real STK Push round-trip (accepted -> user
 * approves on phone -> callback) with a short artificial delay.
 */
export class MockMpesaProvider implements PaymentProvider {
  name = 'MockDarajaSandbox';
  isLive = false;
  private pending = new Map<string, StkPushStatusResult>();

  async initiateStkPush(request: StkPushRequest): Promise<StkPushInitiateResult> {
    await new Promise((r) => setTimeout(r, 250));
    const checkoutRequestId = `ws_CO_MOCK_${Date.now()}`;
    this.pending.set(checkoutRequestId, { state: 'pending' });

    // Simulate the customer approving the prompt on their phone a few seconds later.
    setTimeout(() => {
      this.pending.set(checkoutRequestId, {
        state: 'completed',
        resultCode: 0,
        resultDesc: 'The service request is processed successfully. (Simulated)',
        mpesaReceiptNumber: `MOCK${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        amount: request.amount,
        phoneNumber: request.phoneNumber,
        transactionDate: new Date().toISOString(),
      });
    }, 4000);

    return {
      success: true,
      provider: this.name,
      merchantRequestId: `mock-mr-${Date.now()}`,
      checkoutRequestId,
      customerMessage: 'Success. Request accepted for processing (Simulated — no MPESA_* credentials configured).',
      responseCode: '0',
    };
  }

  async queryStkPushStatus(checkoutRequestId: string): Promise<StkPushStatusResult> {
    return this.pending.get(checkoutRequestId) || { state: 'not_found' };
  }

  async healthCheck() {
    return { status: 'healthy' as const, latencyMs: 20 };
  }
}

/**
 * Real Safaricom Daraja (M-Pesa) integration — M-Pesa Express / STK Push.
 * Uses plain `fetch` against the published Daraja REST endpoints (no SDK
 * dependency), matching the same pattern used for the NVIDIA NIM provider
 * in `multiModelRouter.ts`. Activates only when MPESA_CONSUMER_KEY,
 * MPESA_CONSUMER_SECRET and MPESA_PASSKEY are all set to real values.
 *
 * Docs: https://developer.safaricom.co.ke
 */
export class DarajaMpesaProvider implements PaymentProvider {
  name = 'SafaricomDaraja';
  isLive = true;

  private consumerKey: string;
  private consumerSecret: string;
  private shortcode: string;
  private passkey: string;
  private callbackUrl: string;
  private baseUrl: string;

  private cachedToken: { token: string; expiresAt: number } | null = null;

  constructor(config: {
    consumerKey: string;
    consumerSecret: string;
    shortcode: string;
    passkey: string;
    callbackUrl: string;
    env: string;
  }) {
    this.consumerKey = config.consumerKey;
    this.consumerSecret = config.consumerSecret;
    this.shortcode = config.shortcode;
    this.passkey = config.passkey;
    this.callbackUrl = config.callbackUrl;
    this.baseUrl =
      config.env === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
  }

  /** Normalizes 07XXXXXXXX / +2547XXXXXXXX / 2547XXXXXXXX to Daraja's required 2547XXXXXXXX form. */
  private static normalizePhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('254')) return digits;
    if (digits.startsWith('0')) return `254${digits.slice(1)}`;
    if (digits.startsWith('7') || digits.startsWith('1')) return `254${digits}`;
    return digits;
  }

  private static timestamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
      `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
    );
  }

  private password(ts: string): string {
    return Buffer.from(`${this.shortcode}${this.passkey}${ts}`).toString('base64');
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.token;
    }
    const basicAuth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    const res = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${basicAuth}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Daraja OAuth HTTP ${res.status}: ${text.slice(0, 150)}`);
    }
    const json = await res.json();
    const token = json?.access_token;
    if (!token) throw new Error('Daraja OAuth response missing access_token');
    // Tokens are valid ~1hr; refresh a little early to be safe.
    this.cachedToken = { token, expiresAt: Date.now() + 55 * 60 * 1000 };
    return token;
  }

  async initiateStkPush(request: StkPushRequest): Promise<StkPushInitiateResult> {
    const phone = DarajaMpesaProvider.normalizePhone(request.phoneNumber);
    const ts = DarajaMpesaProvider.timestamp();

    try {
      const token = await this.getAccessToken();
      const res = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          BusinessShortCode: this.shortcode,
          Password: this.password(ts),
          Timestamp: ts,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.max(1, Math.round(request.amount)),
          PartyA: phone,
          PartyB: this.shortcode,
          PhoneNumber: phone,
          CallBackURL: this.callbackUrl,
          AccountReference: request.accountReference.slice(0, 12),
          TransactionDesc: request.transactionDesc.slice(0, 13),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.errorCode) {
        return {
          success: false,
          provider: this.name,
          customerMessage: json.errorMessage || `Daraja HTTP ${res.status}`,
          error: json.errorMessage || `HTTP ${res.status}`,
        };
      }

      return {
        success: json.ResponseCode === '0',
        provider: this.name,
        merchantRequestId: json.MerchantRequestID,
        checkoutRequestId: json.CheckoutRequestID,
        customerMessage: json.CustomerMessage || 'Request accepted for processing',
        responseCode: json.ResponseCode,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Daraja STK Push request failed';
      return { success: false, provider: this.name, customerMessage: message, error: message };
    }
  }

  async queryStkPushStatus(checkoutRequestId: string): Promise<StkPushStatusResult> {
    const ts = DarajaMpesaProvider.timestamp();
    try {
      const token = await this.getAccessToken();
      const res = await fetch(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          BusinessShortCode: this.shortcode,
          Password: this.password(ts),
          Timestamp: ts,
          CheckoutRequestID: checkoutRequestId,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { state: 'not_found' };

      const resultCode = Number(json.ResultCode);
      if (Number.isNaN(resultCode)) {
        // 1032/500 etc. while the request is still awaiting the customer's PIN entry.
        return { state: 'pending' };
      }
      return {
        state: resultCode === 0 ? 'completed' : 'failed',
        resultCode,
        resultDesc: json.ResultDesc,
      };
    } catch {
      return { state: 'pending' };
    }
  }

  async healthCheck() {
    const start = performance.now();
    try {
      await this.getAccessToken();
      return { status: 'healthy' as const, latencyMs: Math.round(performance.now() - start) };
    } catch {
      return { status: 'degraded' as const, latencyMs: Math.round(performance.now() - start) };
    }
  }
}

function buildPaymentProvider(): PaymentProvider {
  const isPlaceholder = (v: string | undefined, placeholder: string) => !v || v === placeholder;

  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;

  const configured =
    !isPlaceholder(consumerKey, 'MY_MPESA_CONSUMER_KEY') &&
    !isPlaceholder(consumerSecret, 'MY_MPESA_CONSUMER_SECRET') &&
    !isPlaceholder(passkey, 'MY_MPESA_PASSKEY') &&
    !isPlaceholder(callbackUrl, 'MY_MPESA_CALLBACK_URL');

  if (!configured) {
    return new MockMpesaProvider();
  }

  return new DarajaMpesaProvider({
    consumerKey: consumerKey!,
    consumerSecret: consumerSecret!,
    shortcode: process.env.MPESA_SHORTCODE || '174379',
    passkey: passkey!,
    callbackUrl: callbackUrl!,
    env: process.env.MPESA_ENV || 'sandbox',
  });
}

export class ProviderRegistry {
  private static notificationProvider: NotificationProvider = new MockNotificationProvider();
  private static identityProvider: IdentityProvider = new MockIdentityProvider();
  private static logisticsProvider: LogisticsProvider = new MockLogisticsProvider();
  private static paymentProvider: PaymentProvider = buildPaymentProvider();

  static getNotification(): NotificationProvider {
    return this.notificationProvider;
  }

  static getIdentity(): IdentityProvider {
    return this.identityProvider;
  }

  static getLogistics(): LogisticsProvider {
    return this.logisticsProvider;
  }

  static getPayment(): PaymentProvider {
    return this.paymentProvider;
  }
}
