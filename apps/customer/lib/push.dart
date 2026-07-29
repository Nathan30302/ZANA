import 'package:flutter/foundation.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/push_refresh.dart';

/// Registers an FCM device token when available and wires refresh hooks.
///
/// Production: wire Firebase Messaging and pass the real token.
/// Demo/pilot: optionally pass `--dart-define=FCM_DEMO_TOKEN=...`.
Future<void> registerPushTokenIfPossible() async {
  const demo = String.fromEnvironment('FCM_DEMO_TOKEN');
  if (demo.isNotEmpty && api.token != null) {
    try {
      await api.registerFcmToken(demo);
      debugPrint('[push] registered demo FCM token');
    } catch (e) {
      debugPrint('[push] demo register failed: $e');
    }
  }
}

/// Call when a push (or simulated push) arrives for a booking.
void onPushBookingUpdate({String? bookingId}) {
  PushRefreshBus.instance.ping(bookingId: bookingId);
}
