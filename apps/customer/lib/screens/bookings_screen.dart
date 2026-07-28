import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/auth_sheet.dart';
import 'package:zana_customer/screens/booking_detail_screen.dart';
import 'package:zana_customer/theme.dart';

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
    'ALL',
    'ACTIVE',
    'COMPLETED',
    'CANCELLED',
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

  @override
  Widget build(BuildContext context) {
    final content = loading && items == null
        ? const Center(child: CircularProgressIndicator())
        : Column(
            children: [
              SizedBox(
                height: 44,
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  scrollDirection: Axis.horizontal,
                  itemCount: filters.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, i) {
                    final f = filters[i];
                    final selected = f == filter;
                    return ChoiceChip(
                      label: Text(f),
                      selected: selected,
                      onSelected: (_) => setState(() => filter = f),
                      selectedColor: ZanaColors.charcoal,
                      labelStyle: TextStyle(
                        color: selected ? Colors.white : ZanaColors.ink,
                      ),
                    );
                  },
                ),
              ),
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
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Bookings',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                              color: ZanaColors.ink,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
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
      appBar: AppBar(
        title: const Text('My bookings'),
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
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Sign in to see your bookings.',
                textAlign: TextAlign.center,
                style: TextStyle(color: ZanaColors.muted),
              ),
              if (widget.embedded) ...[
                const SizedBox(height: 14),
                FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: ZanaColors.charcoal,
                  ),
                  onPressed: () async {
                    final ok = await showAuthSheet(context);
                    if (ok) {
                      _authPrompted = true;
                      await _refresh(silent: false);
                      _startPolling();
                    }
                  },
                  child: const Text('Sign in'),
                ),
              ],
            ],
          ),
        ),
      );
    }
    if (error != null && items == null) {
      return Center(child: Text(error!));
    }
    final filtered = _applyFilter(items ?? []);
    if (filtered.isEmpty) {
      return const Center(
        child: Text(
          'No bookings in this view.\nFind a pro on Discover.',
          textAlign: TextAlign.center,
          style: TextStyle(color: ZanaColors.muted),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () => _refresh(silent: false),
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: filtered.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, i) {
          final b = filtered[i] as Map<String, dynamic>;
          final service = b['service'] as Map<String, dynamic>?;
          final provider = b['provider'] as Map<String, dynamic>?;
          final created = DateTime.tryParse(b['createdAt'] as String? ?? '');
          return Card(
            color: ZanaColors.paper,
            elevation: 0,
            child: ListTile(
              title: Text(service?['name'] as String? ?? 'Service'),
              subtitle: Text(
                '${provider?['displayName'] ?? 'Pro'} · ${b['status']}'
                '${created != null ? '\n${DateFormat('d MMM · HH:mm').format(created.toLocal())}' : ''}',
              ),
              isThreeLine: created != null,
              trailing: Text(
                'K${b['priceZmw']}',
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: ZanaColors.copper,
                ),
              ),
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
            ),
          );
        },
      ),
    );
  }
}
