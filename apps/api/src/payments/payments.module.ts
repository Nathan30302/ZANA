import { Global, Module } from '@nestjs/common';
import { PAYMENT_PROVIDER } from './payment.provider';
import { StubPaymentProvider } from './stub-payment.provider';
import { MobileMoneyPaymentProvider } from './mobile-money.provider';

const useLive =
  process.env.PAYMENT_PROVIDER === 'mobile_money' ||
  !!(process.env.MOMO_SUBSCRIPTION_KEY || process.env.AIRTEL_CLIENT_ID);

@Global()
@Module({
  providers: [
    StubPaymentProvider,
    MobileMoneyPaymentProvider,
    {
      provide: PAYMENT_PROVIDER,
      useClass: useLive ? MobileMoneyPaymentProvider : StubPaymentProvider,
    },
  ],
  exports: [PAYMENT_PROVIDER, StubPaymentProvider, MobileMoneyPaymentProvider],
})
export class PaymentsModule {}
