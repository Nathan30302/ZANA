import { Injectable, Logger } from '@nestjs/common';
import { OtpProvider, OtpSendResult } from './otp.provider';
import { OtpStore } from './otp-store.service';

/**
 * Africa's Talking SMS OTP.
 * Env: AT_API_KEY, AT_USERNAME, AT_SENDER_ID, AT_ENV=sandbox|production
 * Codes persist in Postgres via OtpStore (safe across API instances).
 */
@Injectable()
export class AfricasTalkingOtpProvider implements OtpProvider {
  private readonly logger = new Logger(AfricasTalkingOtpProvider.name);

  constructor(private readonly store: OtpStore) {}

  async send(phone: string): Promise<OtpSendResult> {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const saved = await this.store.save(phone, code);

    const apiKey = process.env.AT_API_KEY?.trim();
    const username = process.env.AT_USERNAME?.trim();
    const from = process.env.AT_SENDER_ID?.trim() || 'ZANA';
    const sandbox = (process.env.AT_ENV || 'production').toLowerCase() === 'sandbox';

    if (!apiKey || !username) {
      this.logger.warn(
        `AT credentials missing — OTP for ${phone} not SMS'd (code stored).`,
      );
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          "Africa's Talking is not configured. Set AT_USERNAME and AT_API_KEY.",
        );
      }
      return {
        phone,
        message: "OTP queued (Africa's Talking not configured)",
        devCode: saved,
      };
    }

    const endpoint = sandbox
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging';

    const body = new URLSearchParams({
      username,
      to: phone,
      message: `Your ZANA code is ${saved}. Valid for 10 minutes.`,
      from,
    });

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`AT SMS failed (${res.status}): ${text}`);
      throw new Error('Failed to send OTP SMS');
    }

    this.logger.log(`OTP SMS accepted by Africa's Talking for ${phone}`);
    return { phone, message: 'OTP sent via SMS' };
  }

  async consume(phone: string, code: string): Promise<boolean> {
    return this.store.consume(phone, code);
  }
}
