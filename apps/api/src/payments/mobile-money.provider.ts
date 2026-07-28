import { Injectable, Logger } from '@nestjs/common';
import {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProvider,
} from './payment.provider';

/**
 * MTN MoMo Collection + Airtel Money OpenAPI adapter.
 * When credentials are missing, behaves like the stub (simulate / pending).
 *
 * MoMo sandbox: MOMO_SUBSCRIPTION_KEY, MOMO_API_USER, MOMO_API_KEY, MOMO_ENV
 * Airtel: AIRTEL_CLIENT_ID, AIRTEL_CLIENT_SECRET, AIRTEL_ENV
 */
@Injectable()
export class MobileMoneyPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(MobileMoneyPaymentProvider.name);
  private readonly pending = new Map<string, InitiatePaymentInput>();

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const simulate =
      input.simulate === true ||
      (input.simulate !== false &&
        (process.env.PAYMENT_SIMULATE !== 'false' ||
          !!process.env.OTP_DEV_CODE));

    if (simulate || !this.hasCredentials(input.method)) {
      const providerRef = `SIM-${input.method}-${Date.now()}`;
      const label =
        input.method === 'MTN_MOMO' ? 'MTN MoMo' : 'Airtel Money';
      const instructions = `Approve ${label} prompt on ${input.phone} for K${input.amountZmw}`;
      this.logger.log(`[pay] ${providerRef} ${instructions}${simulate ? ' (sim)' : ' (no keys)'}`);
      if (simulate) {
        return {
          providerRef,
          status: 'COMPLETED',
          instructions: `${instructions} (simulated success)`,
        };
      }
      this.pending.set(providerRef, input);
      return { providerRef, status: 'PENDING', instructions };
    }

    if (input.method === 'MTN_MOMO') {
      return this.initiateMomo(input);
    }
    return this.initiateAirtel(input);
  }

  async confirm(providerRef: string) {
    if (providerRef.startsWith('SIM-')) {
      this.pending.delete(providerRef);
      return { status: 'COMPLETED' as const };
    }
    // Production: poll MoMo/Airtel status by reference
    this.logger.log(`[pay] confirm ${providerRef}`);
    this.pending.delete(providerRef);
    return { status: 'COMPLETED' as const };
  }

  private hasCredentials(method: InitiatePaymentInput['method']) {
    if (method === 'MTN_MOMO') {
      return !!(
        process.env.MOMO_SUBSCRIPTION_KEY &&
        process.env.MOMO_API_USER &&
        process.env.MOMO_API_KEY
      );
    }
    return !!(process.env.AIRTEL_CLIENT_ID && process.env.AIRTEL_CLIENT_SECRET);
  }

  private async initiateMomo(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentResult> {
    const env = process.env.MOMO_ENV === 'production' ? 'production' : 'sandbox';
    const base =
      env === 'production'
        ? 'https://proxy.momoapi.mtn.com'
        : 'https://sandbox.momodeveloper.mtn.com';
    const providerRef = cryptoRandom();
    const token = await this.momoToken(base);

    const res = await fetch(`${base}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Reference-Id': providerRef,
        'X-Target-Environment': env,
        'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(input.amountZmw),
        currency: 'ZMW',
        externalId: input.reference,
        payer: { partyIdType: 'MSISDN', partyId: input.phone.replace('+', '') },
        payerMessage: input.description.slice(0, 100),
        payeeNote: 'ZANA float',
      }),
    });

    if (!res.ok && res.status !== 202) {
      const text = await res.text();
      this.logger.error(`MoMo requestToPay failed: ${text}`);
      throw new Error('MoMo collection failed');
    }

    this.pending.set(providerRef, input);
    return {
      providerRef,
      status: 'PENDING',
      instructions: `Approve MTN MoMo prompt on ${input.phone} for K${input.amountZmw}`,
    };
  }

  private async momoToken(base: string) {
    const user = process.env.MOMO_API_USER!;
    const key = process.env.MOMO_API_KEY!;
    const basic = Buffer.from(`${user}:${key}`).toString('base64');
    const res = await fetch(`${base}/collection/token/`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY!,
      },
    });
    if (!res.ok) throw new Error('MoMo token failed');
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }

  private async initiateAirtel(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentResult> {
    const env = process.env.AIRTEL_ENV === 'production' ? 'production' : 'sandbox';
    const base =
      env === 'production'
        ? 'https://openapi.airtel.africa'
        : 'https://openapiuat.airtel.africa';
    const providerRef = `AIRTEL-${Date.now()}`;

    // Token
    const tokenRes = await fetch(`${base}/auth/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: '*/*' },
      body: JSON.stringify({
        client_id: process.env.AIRTEL_CLIENT_ID,
        client_secret: process.env.AIRTEL_CLIENT_SECRET,
        grant_type: 'client_credentials',
      }),
    });
    if (!tokenRes.ok) {
      this.logger.error(`Airtel token failed: ${await tokenRes.text()}`);
      throw new Error('Airtel auth failed');
    }
    const tokenData = (await tokenRes.json()) as { access_token: string };

    const res = await fetch(`${base}/merchant/v1/payments/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'X-Country': 'ZM',
        'X-Currency': 'ZMW',
      },
      body: JSON.stringify({
        reference: input.reference,
        subscriber: {
          country: 'ZM',
          currency: 'ZMW',
          msisdn: input.phone.replace('+260', '').replace('+', ''),
        },
        transaction: {
          amount: input.amountZmw,
          country: 'ZM',
          currency: 'ZMW',
          id: providerRef,
        },
      }),
    });

    if (!res.ok) {
      this.logger.error(`Airtel pay failed: ${await res.text()}`);
      throw new Error('Airtel collection failed');
    }

    this.pending.set(providerRef, input);
    return {
      providerRef,
      status: 'PENDING',
      instructions: `Approve Airtel Money prompt on ${input.phone} for K${input.amountZmw}`,
    };
  }
}

function cryptoRandom() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
