import 'package:flutter/foundation.dart';

/// Lightweight bus so push / polling can force Pro screens to refresh.
class PushRefreshBus extends ChangeNotifier {
  PushRefreshBus._();
  static final PushRefreshBus instance = PushRefreshBus._();

  String? lastBookingId;
  DateTime? lastAt;

  void ping({String? bookingId}) {
    lastBookingId = bookingId;
    lastAt = DateTime.now();
    notifyListeners();
  }
}
