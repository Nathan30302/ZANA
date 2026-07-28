import 'dart:async';

import 'package:flutter/material.dart';
import 'package:zana_pro/api.dart';
import 'package:zana_pro/theme.dart';

const _terminalStatuses = {
  'COMPLETED',
  'RATED',
  'CANCELLED',
  'DECLINED',
  'EXPIRED',
};

class JobDetailScreen extends StatefulWidget {
  const JobDetailScreen({super.key, required this.bookingId});

  final String bookingId;

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  Map<String, dynamic>? booking;
  String? error;
  bool busy = false;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _load();
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) => _poll());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  bool _isTerminal(String? status) =>
      status != null && _terminalStatuses.contains(status);

  Future<void> _load() async {
    try {
      final b = await api.getBooking(widget.bookingId);
      if (!mounted) return;
      setState(() {
        booking = b;
        error = null;
      });
      if (_isTerminal(b['status'] as String?)) {
        _pollTimer?.cancel();
        _pollTimer = null;
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => error = e.toString());
    }
  }

  Future<void> _poll() async {
    if (_isTerminal(booking?['status'] as String?)) {
      _pollTimer?.cancel();
      _pollTimer = null;
      return;
    }
    await _load();
  }

  Future<void> _advance(String status, {String? declineReason}) async {
    setState(() => busy = true);
    try {
      await api.updateStatus(
        widget.bookingId,
        status,
        declineReason: declineReason,
      );
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _decline() async {
    final reasonCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Decline job'),
        content: TextField(
          controller: reasonCtrl,
          decoration: const InputDecoration(
            labelText: 'Reason (optional)',
            border: OutlineInputBorder(),
          ),
          maxLines: 2,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Decline'),
          ),
        ],
      ),
    );
    if (ok == true) {
      await _advance('DECLINED', declineReason: reasonCtrl.text.trim());
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = booking;
    final status = b?['status'] as String? ?? '…';
    final service = b?['service'] as Map<String, dynamic>?;
    final customer = b?['customer'] as Map<String, dynamic>?;

    return Scaffold(
      appBar: AppBar(title: const Text('Job detail')),
      body: b == null
          ? Center(
              child: error != null
                  ? Text(error!, style: const TextStyle(color: Colors.red))
                  : const CircularProgressIndicator(),
            )
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Text(
                  service?['name'] as String? ?? 'Service',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                Text('Status: $status · K${b['priceZmw']}',
                    style: const TextStyle(color: ZanaColors.muted)),
                const SizedBox(height: 16),
                const Text('Customer', style: TextStyle(fontWeight: FontWeight.w700)),
                Text(customer?['name'] as String? ?? 'Customer'),
                Text(
                  'Phone: ${customer?['phone'] ?? '—'}',
                  style: const TextStyle(color: ZanaColors.muted),
                ),
                const SizedBox(height: 12),
                const Text('Address', style: TextStyle(fontWeight: FontWeight.w700)),
                Text(
                  b['customerAddress'] as String? ?? '—',
                  style: const TextStyle(color: ZanaColors.muted),
                ),
                if (b['notes'] != null && (b['notes'] as String).isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const Text('Notes', style: TextStyle(fontWeight: FontWeight.w700)),
                  Text(b['notes'] as String),
                ],
                if (b['declineReason'] != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    'Decline reason: ${b['declineReason']}',
                    style: TextStyle(color: Colors.red.shade700),
                  ),
                ],
                const SizedBox(height: 24),
                if (status == 'REQUESTED') ...[
                  FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: ZanaColors.charcoal),
                    onPressed: busy ? null : () => _advance('ACCEPTED'),
                    child: const Text('Accept'),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton(
                    onPressed: busy ? null : _decline,
                    child: const Text('Decline'),
                  ),
                ] else if (status == 'ACCEPTED' || status == 'CONFIRMED')
                  FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: ZanaColors.charcoal),
                    onPressed: busy ? null : () => _advance('ON_THE_WAY'),
                    child: const Text('On the way'),
                  )
                else if (status == 'ON_THE_WAY')
                  FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: ZanaColors.charcoal),
                    onPressed: busy ? null : () => _advance('IN_SERVICE'),
                    child: const Text('Start service'),
                  )
                else if (status == 'IN_SERVICE')
                  FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: ZanaColors.charcoal),
                    onPressed: busy ? null : () => _advance('COMPLETED'),
                    child: const Text('Complete'),
                  )
                else
                  Text(
                    'No actions for $status',
                    style: const TextStyle(color: ZanaColors.muted),
                  ),
              ],
            ),
    );
  }
}
