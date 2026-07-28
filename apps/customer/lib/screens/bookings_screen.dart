import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/auth_sheet.dart';
import 'package:zana_customer/screens/booking_detail_screen.dart';
import 'package:zana_customer/theme.dart';

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> {
  Future<List<dynamic>>? future;
  String filter = 'ALL';

  static const filters = [
    'ALL',
    'ACTIVE',
    'COMPLETED',
    'CANCELLED',
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (api.token == null) {
      final ok = await showAuthSheet(context);
      if (!ok) {
        setState(() => future = Future.value([]));
        return;
      }
    }
    setState(() {
      future = api.listBookings();
    });
  }

  List<dynamic> _applyFilter(List<dynamic> items) {
    if (filter == 'ALL') return items;
    return items.where((raw) {
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('My bookings'),
        actions: [
          if (api.token != null)
            IconButton(
              tooltip: 'Sign out',
              onPressed: () async {
                await api.logout();
                if (!context.mounted) return;
                Navigator.of(context).pop();
              },
              icon: const Icon(Icons.logout),
            ),
        ],
      ),
      body: future == null
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
                Expanded(
                  child: FutureBuilder<List<dynamic>>(
                    future: future,
                    builder: (context, snap) {
                      if (snap.connectionState == ConnectionState.waiting) {
                        return const Center(child: CircularProgressIndicator());
                      }
                      if (snap.hasError) {
                        return Center(child: Text('${snap.error}'));
                      }
                      final items = _applyFilter(snap.data ?? []);
                      if (items.isEmpty) {
                        return const Center(
                          child: Text(
                            'No bookings in this view.\nFind a pro on Home.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: ZanaColors.muted),
                          ),
                        );
                      }
                      return ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, i) {
                          final b = items[i] as Map<String, dynamic>;
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
                                _load();
                              },
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
    );
  }
}
