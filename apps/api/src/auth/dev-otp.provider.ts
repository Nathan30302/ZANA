import { Injectable } from '@nestjs/common';
import { OtpProvider, OtpSendResult } from './otp.provider';
import { OtpStore } from './otp-store.service';

/**
 * Local/dev OTP. Production: set OTP_PROVIDER=africas_talking and credentials.
 */
@Injectable()
export class DevOtpProvider implements OtpProvider {
  constructor(private readonly store: OtpStore) {}

  async send(phone: string): Promise<OtpSendResult> {
    const code = process.env.OTP_DEV_CODE || this.randomCode();
    const saved = await this.store.save(phone, code);
    return {
      phone,
      message: 'OTP sent',
      ...(process.env.OTP_DEV_CODE || process.env.NODE_ENV !== 'production'
        ? { devCode: saved }
        : {}),
    };
  }

  async consume(phone: string, code: string): Promise<boolean> {
    if (await this.store.consume(phone, code)) return true;
    // Convenience for local seeds when challenge row expired but fixed code set
    if (process.env.OTP_DEV_CODE && code === process.env.OTP_DEV_CODE) {
      return true;
    }
    return false;
  }

  private randomCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}
