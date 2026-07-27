import { Injectable, Logger } from '@nestjs/common';
import { OtpProvider, OtpSendResult } from './otp.provider';

/**
 * Africa's Talking SMS OTP adapter.
 * Requires: AT_API_KEY, AT_USERNAME, AT_SENDER_ID
 * Falls back to logging the code when credentials are missing (safe for staging).
 */
@Injectable()
export class AfricasTalkingOtpProvider implements OtpProvider {
  private readonly logger = new Logger(AfricasTalkingOtpProvider.name);
  private readonly codes = new Map<string, string>();

  async send(phone: string): Promise<OtpSendResult> {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    this.codes.set(phone, code);

    const apiKey = process.env.AT_API_KEY;
    const username = process.env.AT_USERNAME;
    const from = process.env.AT_SENDER_ID || 'ZANA';

    if (!apiKey || !username) {
      this.logger.warn(
        `AT credentials missing — OTP for ${phone} logged only: ${code}`,
      );
      return {
        phone,
        message: 'OTP queued (Africa\'s Talking not configured)',
        ...(process.env.NODE_ENV !== 'production' ? { devCode: code } : {}),
      };
    }

    const body = new URLSearchParams({
      username,
      to: phone,
      message: `Your ZANA code is ${code}. Valid for 10 minutes.`,
      from,
    });

    const res = await fetch('https://api.africastalking.com/version1/messaging', {
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
      this.logger.error(`AT SMS failed: ${text}`);
      throw new Error('Failed to send OTP SMS');
    }

    return { phone, message: 'OTP sent via SMS' };
  }

  async consume(phone: string, code: string): Promise<boolean> {
    const expected = this.codes.get(phone);
    if (!expected || code !== expected) return false;
    this.codes.delete(phone);
    return true;
  }
}
