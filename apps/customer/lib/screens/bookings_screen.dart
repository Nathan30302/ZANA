import 'package:flutter/material.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/auth_sheet.dart';
import 'package:zana_customer/theme.dart';

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> {
  Future<List<dynamic>>? future;

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My bookings')),
      body: future == null
          ? const Center(child: CircularProgressIndicator())
          : FutureBuilder<List<dynamic>>(
              future: future,
              builder: (context, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snap.hasError) {
                  return Center(child: Text('${snap.error}'));
                }
                final items = snap.data ?? [];
                if (items.isEmpty) {
                  return const Center(
                    child: Text(
                      'No bookings yet.\nFind a pro on Home.',
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
                    return Card(
                      color: ZanaColors.paper,
                      elevation: 0,
                      child: ListTile(
                        title: Text(service?['name'] as String? ?? 'Service'),
                        subtitle: Text(
                          '${provider?['displayName'] ?? 'Pro'} · ${b['status']}',
                        ),
                        trailing: Text(
                          'K${b['priceZmw']}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            color: ZanaColors.copper,
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
    );
  }
}
