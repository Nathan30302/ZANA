import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AfricasTalkingOtpProvider } from './africas-talking-otp.provider';
import { DevOtpProvider } from './dev-otp.provider';
import { OTP_PROVIDER } from './otp.provider';
import { OtpStore } from './otp-store.service';

const otpProvider = {
  provide: OTP_PROVIDER,
  useClass:
    process.env.OTP_PROVIDER === 'africas_talking'
      ? AfricasTalkingOtpProvider
      : DevOtpProvider,
};

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpStore,
    DevOtpProvider,
    AfricasTalkingOtpProvider,
    otpProvider,
  ],
  exports: [AuthService],
})
export class AuthModule {}
