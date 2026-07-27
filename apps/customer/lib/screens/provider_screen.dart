import 'package:flutter/material.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/auth_sheet.dart';
import 'package:zana_customer/screens/booking_detail_screen.dart';
import 'package:zana_customer/screens/booking_sheet.dart';
import 'package:zana_customer/theme.dart';

class ProviderScreen extends StatefulWidget {
  const ProviderScreen({super.key, required this.providerId});

  final String providerId;

  @override
  State<ProviderScreen> createState() => _ProviderScreenState();
}

class _ProviderScreenState extends State<ProviderScreen> {
  late Future<Map<String, dynamic>> future;

  @override
  void initState() {
    super.initState();
    future = api.getProvider(widget.providerId);
  }

  Future<void> _book(Map<String, dynamic> svc) async {
    if (api.token == null) {
      final ok = await showAuthSheet(context);
      if (!ok) return;
    }
    if (!mounted) return;
    final draft = await showBookingSheet(
      context,
      serviceName: svc['name'] as String,
      serviceMode: svc['mode'] as String? ?? 'AT_SHOP',
    );
    if (draft == null) return;

    try {
      final booking = await api.createBooking(
        providerId: widget.providerId,
        serviceId: svc['id'] as String,
        scheduledAt: draft.scheduledAt,
        customerAddress: draft.address,
        customerLat: draft.lat,
        customerLng: draft.lng,
        notes: draft.notes,
      );
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => BookingDetailScreen(bookingId: booking['id'] as String),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Booking failed: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Provider')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: future,
        builder: (context, snap) {
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final p = snap.data!;
          final services = (p['services'] as List<dynamic>? ?? []);
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                p['displayName'] as String,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              Text(
                '${p['area']} · ${p['type']}',
                style: const TextStyle(color: ZanaColors.muted),
              ),
              const SizedBox(height: 20),
              const Text('Services', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              ...services.map((s) {
                final svc = s as Map<String, dynamic>;
                return Card(
                  color: ZanaColors.paper,
                  elevation: 0,
                  child: ListTile(
                    title: Text(svc['name'] as String),
                    subtitle: Text('${svc['durationMin']} min · ${svc['mode']}'),
                    trailing: Text(
                      'K${svc['priceZmw']}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: ZanaColors.copper,
                      ),
                    ),
                    onTap: () => _book(svc),
                  ),
                );
              }),
            ],
          );
        },
      ),
    );
  }
}
