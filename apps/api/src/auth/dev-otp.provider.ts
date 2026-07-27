import { Injectable } from '@nestjs/common';
import { OtpProvider, OtpSendResult } from './otp.provider';

/**
 * Local/dev OTP. Production: set OTP_PROVIDER=africas_talking and credentials.
 */
@Injectable()
export class DevOtpProvider implements OtpProvider {
  private readonly codes = new Map<string, string>();

  async send(phone: string): Promise<OtpSendResult> {
    const code = process.env.OTP_DEV_CODE || this.randomCode();
    this.codes.set(phone, code);
    return {
      phone,
      message: 'OTP sent',
      ...(process.env.OTP_DEV_CODE ? { devCode: code } : {}),
    };
  }

  async consume(phone: string, code: string): Promise<boolean> {
    const expected = this.codes.get(phone) || process.env.OTP_DEV_CODE;
    if (!expected || code !== expected) return false;
    this.codes.delete(phone);
    return true;
  }

  private randomCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}
