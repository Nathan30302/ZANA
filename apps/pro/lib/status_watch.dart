import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:zana_pro/api.dart';
import 'package:zana_pro/push_refresh.dart';

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

/// Polls provider jobs and surfaces new requests / status changes.
class StatusWatch extends ChangeNotifier {
  StatusWatch._();
  static final StatusWatch instance = StatusWatch._();

  final Map<String, String> _lastStatus = {};
  Timer? _timer;
  StatusAlert? latest;
  bool seeded = false;

  void start() {
    _timer?.cancel();
    if (api.token == null) return;
    _tick();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) => _tick());
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  Future<void> _tick() async {
    if (api.token == null) return;
    try {
      final rows = await api.jobs();
      for (final raw in rows) {
        final b = raw as Map<String, dynamic>;
        final id = b['id'] as String?;
        final status = b['status'] as String?;
        if (id == null || status == null) continue;
        final prev = _lastStatus[id];
        if (seeded &&
            ((prev == null && status == 'REQUESTED') ||
                (prev != null && prev != status))) {
          latest = StatusAlert(
            bookingId: id,
            title: prev == null ? 'New ZANA job' : 'Job update',
            body: _body(status, b),
            status: status,
          );
          PushRefreshBus.instance.ping(bookingId: id);
          notifyListeners();
        }
        _lastStatus[id] = status;
      }
      seeded = true;
    } catch (_) {}
  }

  String _body(String status, Map<String, dynamic> b) {
    final service = b['service'] as Map<String, dynamic>?;
    final name = service?['name'] as String? ?? 'Job';
    if (status == 'REQUESTED') return '$name requested nearby';
    return '$name is now ${status.replaceAll('_', ' ').toLowerCase()}.';
  }
}
