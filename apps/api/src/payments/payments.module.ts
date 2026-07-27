import { Global, Module } from '@nestjs/common';
import { PAYMENT_PROVIDER } from './payment.provider';
import { StubPaymentProvider } from './stub-payment.provider';

@Global()
@Module({
  providers: [
    StubPaymentProvider,
    { provide: PAYMENT_PROVIDER, useExisting: StubPaymentProvider },
  ],
  exports: [PAYMENT_PROVIDER, StubPaymentProvider],
})
export class PaymentsModule {}
