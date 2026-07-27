export const OTP_PROVIDER = Symbol('OTP_PROVIDER');

export interface OtpSendResult {
  phone: string;
  message: string;
  /** Only returned by DevOtpProvider when OTP_DEV_CODE is set */
  devCode?: string;
}

export interface OtpProvider {
  send(phone: string): Promise<OtpSendResult>;
  /** Returns true if code is valid for phone */
  consume(phone: string, code: string): Promise<boolean>;
}
