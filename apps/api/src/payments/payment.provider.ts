export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export type PaymentMethod = 'MTN_MOMO' | 'AIRTEL_MONEY';

export type InitiatePaymentInput = {
  amountZmw: number;
  phone: string;
  method: PaymentMethod;
  reference: string;
  description: string;
  /** When true, auto-complete (dev). When false, leave PENDING for webhook. */
  simulate?: boolean;
};

export type InitiatePaymentResult = {
  providerRef: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  instructions: string;
};

export interface PaymentProvider {
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  /** Confirm a pending collection (webhook / poll) */
  confirm(providerRef: string): Promise<{ status: 'COMPLETED' | 'FAILED' | 'PENDING' }>;
}
