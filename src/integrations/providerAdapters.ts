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

export class ProviderRegistry {
  private static notificationProvider: NotificationProvider = new MockNotificationProvider();
  private static identityProvider: IdentityProvider = new MockIdentityProvider();
  private static logisticsProvider: LogisticsProvider = new MockLogisticsProvider();

  static getNotification(): NotificationProvider {
    return this.notificationProvider;
  }

  static getIdentity(): IdentityProvider {
    return this.identityProvider;
  }

  static getLogistics(): LogisticsProvider {
    return this.logisticsProvider;
  }
}
