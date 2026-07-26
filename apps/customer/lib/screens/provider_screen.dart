import 'package:flutter/material.dart';
import 'package:zana_customer/api.dart';
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

  Future<void> _book(String serviceId) async {
    // Dev convenience: auto OTP if no token yet
    if (api.token == null) {
      await api.requestOtp('+260970000010');
      await api.verifyOtp('+260970000010', '123456');
    }
    final booking = await api.createBooking(
      providerId: widget.providerId,
      serviceId: serviceId,
    );
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Booked · status ${booking['status']}')),
    );
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
                    onTap: () => _book(svc['id'] as String),
                  ),
                );
              }),
              const SizedBox(height: 12),
              const Text(
                'Tap a service to request a booking (dev OTP auto-login).',
                style: TextStyle(color: ZanaColors.muted, fontSize: 12),
              ),
            ],
          );
        },
      ),
    );
  }
}
