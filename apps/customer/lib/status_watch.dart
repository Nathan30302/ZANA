import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/push_refresh.dart';

class StatusAlert {
  const StatusAlert({
    required this.bookingId,
    required this.title,
    required this.body,
    required this.status,
  });

  final String bookingId;
  final String title;
  final String body;
  final String status;
}

/// Polls bookings and surfaces status changes without Firebase.
class StatusWatch extends ChangeNotifier {
  StatusWatch._();
  static final StatusWatch instance = StatusWatch._();

  final Map<String, String> _lastStatus = {};
  Timer? _timer;
  StatusAlert? latest;
  Map<String, dynamic>? activeBooking;

  static const _active = {
    'REQUESTED',
    'ACCEPTED',
    'ON_THE_WAY',
    'CONFIRMED',
    'IN_SERVICE',
  };

  void start() {
    _timer?.cancel();
    if (api.token == null) return;
    _tick();
    _timer = Timer.periodic(const Duration(seconds: 6), (_) => _tick());
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  Future<void> _tick() async {
    if (api.token == null) return;
    try {
      final rows = await api.listBookings();
      Map<String, dynamic>? active;
      for (final raw in rows) {
        final b = raw as Map<String, dynamic>;
        final id = b['id'] as String?;
        final status = b['status'] as String?;
        if (id == null || status == null) continue;
        final prev = _lastStatus[id];
        if (prev != null && prev != status) {
          latest = StatusAlert(
            bookingId: id,
            title: _title(status),
            body: _body(status, b),
            status: status,
          );
          PushRefreshBus.instance.ping(bookingId: id);
          notifyListeners();
        }
        _lastStatus[id] = status;
        if (_active.contains(status)) {
          active ??= b;
        }
      }
      final changed = active?['id'] != activeBooking?['id'] ||
          active?['status'] != activeBooking?['status'];
      activeBooking = active;
      if (changed) notifyListeners();
    } catch (_) {}
  }

  String _title(String status) {
    switch (status) {
      case 'ACCEPTED':
        return 'Pro accepted';
      case 'ON_THE_WAY':
        return 'On the way';
      case 'CONFIRMED':
        return 'Pro arrived';
      case 'IN_SERVICE':
        return 'Service started';
      case 'COMPLETED':
        return 'Service complete';
      case 'DECLINED':
      case 'EXPIRED':
      case 'CANCELLED':
        return 'Booking ended';
      default:
        return 'ZANA update';
    }
  }

  String _body(String status, Map<String, dynamic> b) {
    final service = b['service'] as Map<String, dynamic>?;
    final name = service?['name'] as String? ?? 'Your booking';
    return '$name is now ${status.replaceAll('_', ' ').toLowerCase()}.';
  }
}
