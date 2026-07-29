import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:zana_pro/api.dart';
import 'package:zana_pro/map_style.dart';
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

  Future<void> _navigateToCustomer(double lat, double lng) async {
    final uri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng&travelmode=driving',
    );
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open maps')),
      );
    }
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
        backgroundColor: ZanaColors.paper,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Decline job'),
        content: TextField(
          controller: reasonCtrl,
          decoration: const InputDecoration(labelText: 'Reason (optional)'),
          maxLines: 2,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
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
        backgroundColor: ZanaColors.paper,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Cancel job'),
        content: TextField(
          controller: reasonCtrl,
          decoration: const InputDecoration(labelText: 'Reason'),
          maxLines: 2,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Back'),
          ),
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
        backgroundColor: ZanaColors.paper,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Report issue'),
        content: TextField(
          controller: noteCtrl,
          decoration: const InputDecoration(labelText: 'What went wrong?'),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Back'),
          ),
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

  String _statusLabel(String status) {
    switch (status) {
      case 'REQUESTED':
        return 'New request';
      case 'ACCEPTED':
        return 'Accepted';
      case 'CONFIRMED':
        return 'Customer ready';
      case 'ON_THE_WAY':
        return 'On the way';
      case 'IN_SERVICE':
        return 'In service';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status.replaceAll('_', ' ');
    }
  }

  List<Widget> _statusActions(String status, String? mode) {
    final atShop = mode == 'AT_SHOP';
    Widget primary(String label, VoidCallback onPressed, {Color? color}) {
      return SizedBox(
        width: double.infinity,
        child: FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: color ?? ZanaColors.charcoal,
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
          onPressed: busy ? null : onPressed,
          child: Text(label),
        ),
      );
    }

    if (status == 'REQUESTED') {
      return [
        primary('Accept job', () => _advance('ACCEPTED'), color: ZanaColors.copper),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: busy ? null : _decline,
            child: const Text('Decline'),
          ),
        ),
      ];
    }
    if (status == 'ACCEPTED') {
      return [
        if (atShop)
          primary('Customer arrived', () => _advance('CONFIRMED'))
        else
          primary('On the way', () => _advance('ON_THE_WAY'),
              color: ZanaColors.copper),
        if (atShop) ...[
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: busy ? null : () => _advance('ON_THE_WAY'),
              child: const Text('On the way (mobile)'),
            ),
          ),
        ],
      ];
    }
    if (status == 'CONFIRMED') {
      return [
        primary('Start service', () => _advance('IN_SERVICE'),
            color: ZanaColors.copper),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: busy ? null : () => _advance('ON_THE_WAY'),
            child: const Text('On the way'),
          ),
        ),
      ];
    }
    if (status == 'ON_THE_WAY') {
      return [
        primary('Start service', () => _advance('IN_SERVICE'),
            color: ZanaColors.copper),
      ];
    }
    if (status == 'IN_SERVICE') {
      return [
        primary('Complete job', () => _advance('COMPLETED'),
            color: ZanaColors.copper),
      ];
    }
    return [
      Text(
        'No actions for ${_statusLabel(status)}',
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
      backgroundColor: ZanaColors.cream,
      appBar: AppBar(
        title: const Text('Job'),
        backgroundColor: ZanaColors.cream,
      ),
      body: b == null
          ? Center(
              child: error != null
                  ? Text(error!, style: const TextStyle(color: Colors.red))
                  : const CircularProgressIndicator(color: ZanaColors.copper),
            )
          : ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
              children: [
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: ZanaColors.paper,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: ZanaColors.ink.withValues(alpha: 0.05),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: ZanaColors.copper.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _statusLabel(status),
                          style: const TextStyle(
                            color: ZanaColors.copper,
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        service?['name'] as String? ?? 'Service',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        [
                          'K${b['priceZmw']}',
                          if (mode != null)
                            mode == 'COMES_TO_YOU' ? 'Comes to you' : 'At shop',
                        ].join(' · '),
                        style: const TextStyle(
                          color: ZanaColors.muted,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                _InfoBlock(
                  title: 'Customer',
                  lines: [
                    customer?['name'] as String? ?? 'Customer',
                    'Phone: ${customer?['phone'] ?? '—'}',
                  ],
                ),
                const SizedBox(height: 10),
                _InfoBlock(
                  title: 'Address',
                  lines: [b['customerAddress'] as String? ?? '—'],
                ),
                if ((b['customerLat'] as num?) != null &&
                    (b['customerLng'] as num?) != null) ...[
                  const SizedBox(height: 12),
                  _JobMap(
                    customer: LatLng(
                      (b['customerLat'] as num).toDouble(),
                      (b['customerLng'] as num).toDouble(),
                    ),
                    provider: (b['providerLat'] as num?) != null &&
                            (b['providerLng'] as num?) != null
                        ? LatLng(
                            (b['providerLat'] as num).toDouble(),
                            (b['providerLng'] as num).toDouble(),
                          )
                        : null,
                  ),
                ],
                if (b['nearCustomer'] == true &&
                    (status == 'ON_THE_WAY' || status == 'ACCEPTED')) ...[
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Text(
                      'You’re near the customer — tap Start service when ready.',
                      style: TextStyle(
                        color: Color(0xFF047857),
                        fontWeight: FontWeight.w700,
                        height: 1.35,
                      ),
                    ),
                  ),
                ],
                if ((b['customerLat'] as num?) != null &&
                    (b['customerLng'] as num?) != null &&
                    !_isTerminal(status)) ...[
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: busy
                          ? null
                          : () => _navigateToCustomer(
                                (b['customerLat'] as num).toDouble(),
                                (b['customerLng'] as num).toDouble(),
                              ),
                      icon: const Icon(Icons.navigation_rounded),
                      label: const Text('Navigate to customer'),
                    ),
                  ),
                ],
                if (b['notes'] != null &&
                    (b['notes'] as String).isNotEmpty) ...[
                  const SizedBox(height: 10),
                  _InfoBlock(
                    title: 'Notes',
                    lines: [b['notes'] as String],
                  ),
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
                  const SizedBox(height: 18),
                  const Text(
                    'Assign staff',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      ChoiceChip(
                        label: const Text('Unassigned'),
                        selected: assigned == null,
                        selectedColor: ZanaColors.sand,
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
                          selectedColor: ZanaColors.sand,
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
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: busy ? null : _cancel,
                      child: const Text('Cancel job'),
                    ),
                  ),
                ],
                const SizedBox(height: 4),
                Center(
                  child: TextButton(
                    onPressed: busy ? null : _dispute,
                    child: const Text('Report issue'),
                  ),
                ),
              ],
            ),
    );
  }
}

class _InfoBlock extends StatelessWidget {
  const _InfoBlock({required this.title, required this.lines});

  final String title;
  final List<String> lines;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ZanaColors.paper,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ZanaColors.ink.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 13,
              color: ZanaColors.muted,
            ),
          ),
          const SizedBox(height: 6),
          for (final line in lines)
            Padding(
              padding: const EdgeInsets.only(bottom: 2),
              child: Text(
                line,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  height: 1.35,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _JobMap extends StatelessWidget {
  const _JobMap({required this.customer, this.provider});

  final LatLng customer;
  final LatLng? provider;

  @override
  Widget build(BuildContext context) {
    final center = provider ?? customer;

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: SizedBox(
        height: 180,
        child: FlutterMap(
          options: MapOptions(
            initialCenter: center,
            initialZoom: 14,
            interactionOptions: const InteractionOptions(
              flags: InteractiveFlag.pinchZoom | InteractiveFlag.drag,
            ),
          ),
          children: [
            ...zanaMapTileLayers(context, ZanaMapMode.hybrid),
            if (provider != null)
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: [provider!, customer],
                    color: ZanaColors.copper.withValues(alpha: 0.85),
                    strokeWidth: 3.5,
                  ),
                ],
              ),
            MarkerLayer(
              markers: [
                Marker(
                  point: customer,
                  width: 40,
                  height: 40,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: ZanaColors.ink, width: 2),
                    ),
                    child: const Icon(Icons.home_rounded, size: 18),
                  ),
                ),
                if (provider != null)
                  Marker(
                    point: provider!,
                    width: 40,
                    height: 40,
                    child: Container(
                      decoration: const BoxDecoration(
                        color: ZanaColors.copper,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.navigation_rounded,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
