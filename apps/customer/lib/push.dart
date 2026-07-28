import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:zana_customer/api.dart';

/// Registers an FCM device token when available.
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
