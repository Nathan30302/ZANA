import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/push_refresh.dart';
import 'package:zana_customer/screens/auth_sheet.dart';
import 'package:zana_customer/screens/booking_detail_screen.dart';
import 'package:zana_customer/theme.dart';
import 'package:zana_customer/widgets.dart';

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
    ('CANCELLED', 'Ended'),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    PushRefreshBus.instance.addListener(_onPush);
    _bootstrap();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    PushRefreshBus.instance.removeListener(_onPush);
    _pollTimer?.cancel();
    super.dispose();
  }

  void _onPush() => _refresh(silent: true);

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

  ZanaChipTone _tone(String status) {
    switch (status) {
      case 'REQUESTED':
      case 'ACCEPTED':
      case 'ON_THE_WAY':
      case 'IN_SERVICE':
        return ZanaChipTone.copper;
      case 'COMPLETED':
      case 'RATED':
      case 'CONFIRMED':
        return ZanaChipTone.ok;
      case 'CANCELLED':
      case 'DECLINED':
      case 'EXPIRED':
        return ZanaChipTone.danger;
      default:
        return ZanaChipTone.neutral;
    }
  }

  String _label(String status) => status.replaceAll('_', ' ');

  @override
  Widget build(BuildContext context) {
    final content = loading && items == null
        ? const Center(
            child: CircularProgressIndicator(color: ZanaColors.copper),
          )
        : Column(
            children: [
              SizedBox(
                height: 42,
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  scrollDirection: Axis.horizontal,
                  itemCount: filters.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, i) {
                    final (key, label) = filters[i];
                    final selected = key == filter;
                    return Material(
                      color: selected ? ZanaColors.ink : ZanaColors.paper,
                      borderRadius: BorderRadius.circular(12),
                      child: InkWell(
                        onTap: () => setState(() => filter = key),
                        borderRadius: BorderRadius.circular(12),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          child: Text(
                            label,
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                              color: selected ? Colors.white : ZanaColors.ink,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 8),
              Expanded(child: _buildBody()),
            ],
          );

    if (widget.embedded) {
      return ColoredBox(
        color: ZanaColors.cream,
        child: SafeArea(
          bottom: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 8, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Bookings',
                            style: GoogleFonts.syne(
                              fontSize: 28,
                              fontWeight: FontWeight.w800,
                              color: ZanaColors.ink,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Track every appointment',
                            style: TextStyle(color: ZanaColors.muted),
                          ),
                        ],
                      ),
                    ),
                    if (api.token != null)
                      IconButton(
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
                      ),
                  ],
                ),
              ),
              Expanded(child: content),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: ZanaColors.cream,
      appBar: AppBar(
        title: const Text('My bookings'),
        backgroundColor: ZanaColors.cream,
        actions: [
          if (api.token != null)
            IconButton(
              tooltip: 'Sign out',
              onPressed: () async {
                _pollTimer?.cancel();
                await api.logout();
                if (!context.mounted) return;
                Navigator.of(context).pop();
              },
              icon: const Icon(Icons.logout),
            ),
        ],
      ),
      body: content,
    );
  }

  Widget _buildBody() {
    if (api.token == null) {
      return ZanaEmptyState(
        icon: Icons.lock_outline_rounded,
        title: 'Sign in to track jobs',
        body: 'Your live and past bookings will show up here.',
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
      return ZanaEmptyState(
        icon: Icons.wifi_off_rounded,
        title: 'Couldn’t load bookings',
        body: error!,
        actionLabel: 'Retry',
        onAction: () => _refresh(silent: false),
      );
    }
    final filtered = _applyFilter(items ?? []);
    if (filtered.isEmpty) {
      return const ZanaEmptyState(
        icon: Icons.calendar_month_outlined,
        title: 'Nothing here yet',
        body: 'Book a nearby pro on Discover — they’ll appear in Active.',
      );
    }
    return RefreshIndicator(
      color: ZanaColors.copper,
      onRefresh: () => _refresh(silent: false),
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
        itemCount: filtered.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, i) {
          final b = filtered[i] as Map<String, dynamic>;
          final service = b['service'] as Map<String, dynamic>?;
          final provider = b['provider'] as Map<String, dynamic>?;
          final created = DateTime.tryParse(b['createdAt'] as String? ?? '');
          final status = b['status'] as String? ?? '';
          final asap = b['scheduledAt'] == null;

          return Material(
            color: ZanaColors.paper,
            borderRadius: BorderRadius.circular(18),
            child: InkWell(
              borderRadius: BorderRadius.circular(18),
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
              child: Ink(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: ZanaColors.ink.withValues(alpha: 0.05),
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          ZanaStatusChip(
                            label: _label(status),
                            tone: _tone(status),
                          ),
                          if (asap) ...[
                            const SizedBox(width: 8),
                            const ZanaStatusChip(
                              label: 'ASAP',
                              tone: ZanaChipTone.copper,
                            ),
                          ],
                          const Spacer(),
                          Text(
                            'K${b['priceZmw']}',
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              color: ZanaColors.copper,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        service?['name'] as String? ?? 'Service',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 17,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        [
                          provider?['displayName'] ?? 'Pro',
                          if (created != null)
                            DateFormat('d MMM · HH:mm').format(created.toLocal()),
                        ].join(' · '),
                        style: const TextStyle(
                          color: ZanaColors.muted,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
