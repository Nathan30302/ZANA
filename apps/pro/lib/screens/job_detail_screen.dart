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
  List<dynamic> staff = [];
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
      List<dynamic> s = [];
      try {
        s = await api.listStaff();
      } catch (_) {}
      if (!mounted) return;
      setState(() {
        booking = b;
        staff = s;
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

  Future<void> _advance(
    String status, {
    String? declineReason,
    String? cancelReason,
  }) async {
    setState(() => busy = true);
    try {
      await api.updateStatus(
        widget.bookingId,
        status,
        declineReason: declineReason,
        cancelReason: cancelReason,
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
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
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

  Future<void> _cancel() async {
    final reasonCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel job'),
        content: TextField(
          controller: reasonCtrl,
          decoration: const InputDecoration(
            labelText: 'Reason',
            border: OutlineInputBorder(),
          ),
          maxLines: 2,
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Back')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Cancel job'),
          ),
        ],
      ),
    );
    if (ok == true) {
      await _advance('CANCELLED', cancelReason: reasonCtrl.text.trim());
    }
  }

  Future<void> _dispute() async {
    final noteCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Report issue'),
        content: TextField(
          controller: noteCtrl,
          decoration: const InputDecoration(
            labelText: 'What went wrong?',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Back')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Submit'),
          ),
        ],
      ),
    );
    if (ok != true || noteCtrl.text.trim().isEmpty) return;
    setState(() => busy = true);
    try {
      await api.reportDispute(widget.bookingId, noteCtrl.text.trim());
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _assign(String? staffUserId) async {
    setState(() => busy = true);
    try {
      await api.assignStaff(widget.bookingId, staffUserId);
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  List<Widget> _statusActions(String status, String? mode) {
    final atShop = mode == 'AT_SHOP';
    if (status == 'REQUESTED') {
      return [
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
      ];
    }
    if (status == 'ACCEPTED') {
      return [
        if (atShop)
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: ZanaColors.charcoal),
            onPressed: busy ? null : () => _advance('CONFIRMED'),
            child: const Text('Customer arrived'),
          )
        else
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: ZanaColors.charcoal),
            onPressed: busy ? null : () => _advance('ON_THE_WAY'),
            child: const Text('On the way'),
          ),
        if (atShop) ...[
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: busy ? null : () => _advance('ON_THE_WAY'),
            child: const Text('On the way (mobile)'),
          ),
        ],
      ];
    }
    if (status == 'CONFIRMED') {
      return [
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: ZanaColors.charcoal),
          onPressed: busy ? null : () => _advance('IN_SERVICE'),
          child: const Text('Start service'),
        ),
        const SizedBox(height: 8),
        OutlinedButton(
          onPressed: busy ? null : () => _advance('ON_THE_WAY'),
          child: const Text('On the way'),
        ),
      ];
    }
    if (status == 'ON_THE_WAY') {
      return [
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: ZanaColors.charcoal),
          onPressed: busy ? null : () => _advance('IN_SERVICE'),
          child: const Text('Start service'),
        ),
      ];
    }
    if (status == 'IN_SERVICE') {
      return [
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: ZanaColors.charcoal),
          onPressed: busy ? null : () => _advance('COMPLETED'),
          child: const Text('Complete'),
        ),
      ];
    }
    return [
      Text(
        'No actions for $status',
        style: const TextStyle(color: ZanaColors.muted),
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final b = booking;
    final status = b?['status'] as String? ?? '…';
    final service = b?['service'] as Map<String, dynamic>?;
    final customer = b?['customer'] as Map<String, dynamic>?;
    final assigned = b?['assignedStaff'] as Map<String, dynamic>?;
    final mode = service?['mode'] as String?;
    final canCancel = status == 'REQUESTED' ||
        status == 'ACCEPTED' ||
        status == 'CONFIRMED' ||
        status == 'ON_THE_WAY' ||
        status == 'IN_SERVICE';

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
                if (mode != null)
                  Text('Mode: $mode',
                      style: const TextStyle(color: ZanaColors.muted)),
                const SizedBox(height: 16),
                const Text('Customer',
                    style: TextStyle(fontWeight: FontWeight.w700)),
                Text(customer?['name'] as String? ?? 'Customer'),
                Text(
                  'Phone: ${customer?['phone'] ?? '—'}',
                  style: const TextStyle(color: ZanaColors.muted),
                ),
                const SizedBox(height: 12),
                const Text('Address',
                    style: TextStyle(fontWeight: FontWeight.w700)),
                Text(
                  b['customerAddress'] as String? ?? '—',
                  style: const TextStyle(color: ZanaColors.muted),
                ),
                if (b['notes'] != null && (b['notes'] as String).isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const Text('Notes',
                      style: TextStyle(fontWeight: FontWeight.w700)),
                  Text(b['notes'] as String),
                ],
                if (b['declineReason'] != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    'Decline reason: ${b['declineReason']}',
                    style: TextStyle(color: Colors.red.shade700),
                  ),
                ],
                if (b['cancelReason'] != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    'Cancel reason: ${b['cancelReason']}',
                    style: TextStyle(color: Colors.red.shade700),
                  ),
                ],
                if (b['disputeNote'] != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    'Dispute: ${b['disputeNote']}',
                    style: const TextStyle(color: ZanaColors.muted),
                  ),
                ],
                if (staff.isNotEmpty && !_isTerminal(status)) ...[
                  const SizedBox(height: 16),
                  const Text('Assign staff',
                      style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      ChoiceChip(
                        label: const Text('Unassigned'),
                        selected: assigned == null,
                        onSelected: busy
                            ? null
                            : (_) {
                                _assign(null);
                              },
                      ),
                      ...staff.map((raw) {
                        final m = raw as Map<String, dynamic>;
                        final user = m['user'] as Map<String, dynamic>?;
                        final uid = user?['id'] as String?;
                        final label =
                            '${user?['name'] ?? user?['phone'] ?? 'Staff'}'
                            '${m['title'] != null ? ' · ${m['title']}' : ''}';
                        return ChoiceChip(
                          label: Text(label),
                          selected: assigned?['id'] == uid,
                          onSelected: busy || uid == null
                              ? null
                              : (_) {
                                  _assign(uid);
                                },
                        );
                      }),
                    ],
                  ),
                ] else if (assigned != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    'Assigned: ${assigned['name'] ?? assigned['phone']}',
                    style: const TextStyle(color: ZanaColors.muted),
                  ),
                ],
                const SizedBox(height: 24),
                ..._statusActions(status, mode),
                if (canCancel) ...[
                  const SizedBox(height: 8),
                  OutlinedButton(
                    onPressed: busy ? null : _cancel,
                    child: const Text('Cancel job'),
                  ),
                ],
                const SizedBox(height: 8),
                TextButton(
                  onPressed: busy ? null : _dispute,
                  child: const Text('Report issue'),
                ),
              ],
            ),
    );
  }
}
