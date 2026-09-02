import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/auth_sheet.dart';
import 'package:zana_customer/screens/booking_detail_screen.dart';
import 'package:zana_customer/theme.dart';
import 'package:zana_customer/widgets/zana_ui.dart';

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen>
    with WidgetsBindingObserver {
  List<dynamic>? items;
  String? error;
  bool loading = true;
  String filter = 'ALL';
  Timer? _pollTimer;
  bool _authPrompted = false;

  static const filters = [
    ('ALL', 'All'),
    ('ACTIVE', 'Active'),
    ('COMPLETED', 'Done'),
    ('CANCELLED', 'Cancelled'),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _bootstrap();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _pollTimer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _startPolling();
      _refresh(silent: true);
    } else if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive) {
      _pollTimer?.cancel();
      _pollTimer = null;
    }
  }

  Future<void> _bootstrap() async {
    if (api.token == null) {
      if (widget.embedded) {
        if (!mounted) return;
        setState(() {
          items = [];
          loading = false;
        });
        return;
      }
      if (!_authPrompted) {
        _authPrompted = true;
        final ok = await showAuthSheet(context);
        if (!ok) {
          if (!mounted) return;
          setState(() {
            items = [];
            loading = false;
          });
          return;
        }
      }
    }
    await _refresh(silent: false);
    _startPolling();
  }

  void _startPolling() {
    _pollTimer?.cancel();
    if (api.token == null) return;
    _pollTimer = Timer.periodic(const Duration(seconds: 8), (_) {
      _refresh(silent: true);
    });
  }

  Future<void> _refresh({required bool silent}) async {
    if (api.token == null) return;
    if (!silent && mounted) {
      setState(() {
        loading = true;
        error = null;
      });
    }
    try {
      final list = await api.listBookings();
      if (!mounted) return;
      setState(() {
        items = list;
        loading = false;
        error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        error = e.toString();
        loading = false;
      });
    }
  }

  List<dynamic> _applyFilter(List<dynamic> source) {
    if (filter == 'ALL') return source;
    return source.where((raw) {
      final s = (raw as Map)['status'] as String?;
      if (filter == 'ACTIVE') {
        return s == 'REQUESTED' ||
            s == 'ACCEPTED' ||
            s == 'CONFIRMED' ||
            s == 'ON_THE_WAY' ||
            s == 'IN_SERVICE';
      }
      if (filter == 'COMPLETED') {
        return s == 'COMPLETED' || s == 'RATED';
      }
      if (filter == 'CANCELLED') {
        return s == 'CANCELLED' || s == 'DECLINED' || s == 'EXPIRED';
      }
      return true;
    }).toList();
  }

  Color _statusColor(String? status) {
    switch (status) {
      case 'COMPLETED':
      case 'RATED':
        return ZanaColors.sage;
      case 'CANCELLED':
      case 'DECLINED':
      case 'EXPIRED':
        return ZanaColors.muted;
      default:
        return ZanaColors.copper;
    }
  }

  @override
  Widget build(BuildContext context) {
    final content = loading && items == null
        ? const Center(
            child: CircularProgressIndicator(color: ZanaColors.copper),
          )
        : Column(
            children: [
              SizedBox(
                height: 44,
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  scrollDirection: Axis.horizontal,
                  itemCount: filters.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, i) {
                    final (code, label) = filters[i];
                    return ZanaChip(
                      label: label,
                      selected: code == filter,
                      emphasis: true,
                      onTap: () => setState(() => filter = code),
                    );
                  },
                ),
              ),
              Expanded(child: _buildBody()),
            ],
          );

    if (widget.embedded) {
      return DecoratedBox(
        decoration: const BoxDecoration(gradient: ZanaColors.surfaceGradient),
        child: SafeArea(
          bottom: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ZanaScreenHeader(
                overline: 'YOUR APPOINTMENTS',
                title: 'Bookings',
                subtitle: 'Track every appointment in one place',
                trailing: api.token != null
                    ? IconButton(
                        tooltip: 'Sign out',
                        onPressed: () async {
                          _pollTimer?.cancel();
                          await api.logout();
                          if (!context.mounted) return;
                          setState(() {
                            items = [];
                            _authPrompted = false;
                          });
                        },
                        icon: const Icon(Icons.logout_rounded),
                      )
                    : null,
              ),
              Expanded(child: content),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('My bookings')),
      body: content,
    );
  }

  Widget _buildBody() {
    if (api.token == null) {
      return ZanaEmptyState(
        icon: Icons.event_note_outlined,
        title: 'Sign in required',
        subtitle: 'Sign in to see and track your bookings.',
        actionLabel: widget.embedded ? 'Sign in' : null,
        onAction: widget.embedded
            ? () async {
                final ok = await showAuthSheet(context);
                if (ok) {
                  _authPrompted = true;
                  await _refresh(silent: false);
                  _startPolling();
                }
              }
            : null,
      );
    }
    if (error != null && items == null) {
      return Center(child: Text(error!));
    }
    final filtered = _applyFilter(items ?? []);
    if (filtered.isEmpty) {
      return ZanaEmptyState(
        icon: Icons.calendar_today_outlined,
        title: 'No bookings yet',
        subtitle: 'Find a pro on Discover and book your first appointment.',
      );
    }
    return RefreshIndicator(
      color: ZanaColors.copper,
      onRefresh: () => _refresh(silent: false),
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
        itemCount: filtered.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, i) {
          final b = filtered[i] as Map<String, dynamic>;
          final service = b['service'] as Map<String, dynamic>?;
          final provider = b['provider'] as Map<String, dynamic>?;
          final created = DateTime.tryParse(b['createdAt'] as String? ?? '');
          final status = b['status'] as String?;

          return Material(
            color: ZanaColors.paper,
            borderRadius: BorderRadius.circular(18),
            child: InkWell(
              onTap: () async {
                await Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => BookingDetailScreen(
                      bookingId: b['id'] as String,
                    ),
                  ),
                );
                _refresh(silent: true);
              },
              borderRadius: BorderRadius.circular(18),
              child: Ink(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [ZanaDecorations.softShadow],
                  border: Border.all(
                    color: ZanaColors.ink.withValues(alpha: 0.05),
                  ),
                ),
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: ZanaColors.blush,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        Icons.spa_outlined,
                        color: ZanaColors.copper,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            service?['name'] as String? ?? 'Service',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            provider?['displayName'] as String? ?? 'Pro',
                            style: ZanaText.subtitle(context).copyWith(fontSize: 13),
                          ),
                          if (created != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              DateFormat('d MMM · HH:mm').format(created.toLocal()),
                              style: ZanaText.subtitle(context).copyWith(fontSize: 12),
                            ),
                          ],
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          'K${b['priceZmw']}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            color: ZanaColors.copper,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: _statusColor(status).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            status ?? '',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: _statusColor(status),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
