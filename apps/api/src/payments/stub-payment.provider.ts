import { Injectable, Logger } from '@nestjs/common';
import {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProvider,
} from './payment.provider';

/**
 * Simulated MTN MoMo / Airtel Money collections.
 * Swap for real MTN MoMo Collection API / Airtel Money OpenAPI when keys exist:
 *   MOMO_SUBSCRIPTION_KEY, MOMO_API_USER, MOMO_API_KEY, MOMO_ENV
 *   AIRTEL_CLIENT_ID, AIRTEL_CLIENT_SECRET, AIRTEL_ENV
 */
@Injectable()
export class StubPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(StubPaymentProvider.name);
  private readonly pending = new Set<string>();

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const providerRef = `${input.method}-${Date.now()}`;
    this.pending.add(providerRef);

    const label =
      input.method === 'MTN_MOMO' ? 'MTN MoMo' : 'Airtel Money';
    const instructions = `Approve ${label} prompt on ${input.phone} for K${input.amountZmw}`;

    this.logger.log(`[pay stub] ${providerRef} ${instructions}`);

    const simulate =
      input.simulate === true ||
      (input.simulate !== false &&
        (process.env.PAYMENT_SIMULATE !== 'false' ||
          !!process.env.OTP_DEV_CODE));

    if (simulate) {
      this.pending.delete(providerRef);
      return {
        providerRef,
        status: 'COMPLETED',
        instructions: `${instructions} (simulated success)`,
      };
    }

    return { providerRef, status: 'PENDING', instructions };
  }

  async confirm(providerRef: string) {
    if (this.pending.has(providerRef)) {
      this.pending.delete(providerRef);
      return { status: 'COMPLETED' as const };
    }
    return { status: 'COMPLETED' as const };
  }
}
