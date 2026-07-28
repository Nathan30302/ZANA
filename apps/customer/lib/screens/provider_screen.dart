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
  late Future<List<dynamic>> reviewsFuture;

  @override
  void initState() {
    super.initState();
    future = api.getProvider(widget.providerId);
    reviewsFuture = api.providerReviews(widget.providerId);
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
          final photos = (p['photos'] as List<dynamic>? ?? []);
          final cover = p['coverPhotoUrl'] as String?;
          final rating = (p['ratingAvg'] as num?)?.toDouble() ?? 0;
          final count = p['ratingCount'] as int? ?? 0;
          final bio = p['bio'] as String?;

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (cover != null || photos.isNotEmpty)
                SizedBox(
                  height: 160,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      if (cover != null)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.network(
                              cover,
                              width: 240,
                              height: 160,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                width: 240,
                                color: ZanaColors.paper,
                                child: const Icon(Icons.image),
                              ),
                            ),
                          ),
                        ),
                      ...photos.map((raw) {
                        final url = (raw as Map)['url'] as String?;
                        if (url == null) return const SizedBox.shrink();
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.network(
                              url,
                              width: 160,
                              height: 160,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                width: 160,
                                color: ZanaColors.paper,
                                child: const Icon(Icons.image),
                              ),
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              if (cover != null || photos.isNotEmpty) const SizedBox(height: 16),
              Text(
                p['displayName'] as String,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              Text(
                '${p['area']} · ${p['type']} · '
                '${count > 0 ? '${rating.toStringAsFixed(1)}★ ($count)' : 'New on ZANA'}',
                style: const TextStyle(color: ZanaColors.muted),
              ),
              if (bio != null && bio.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(bio),
              ],
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
              const SizedBox(height: 20),
              const Text('Reviews', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              FutureBuilder<List<dynamic>>(
                future: reviewsFuture,
                builder: (context, rSnap) {
                  if (!rSnap.hasData) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: LinearProgressIndicator(),
                    );
                  }
                  final reviews = rSnap.data!;
                  if (reviews.isEmpty) {
                    return const Text(
                      'No reviews yet — be the first after your appointment.',
                      style: TextStyle(color: ZanaColors.muted),
                    );
                  }
                  return Column(
                    children: reviews.map((raw) {
                      final r = raw as Map<String, dynamic>;
                      final user = r['user'] as Map<String, dynamic>?;
                      return Card(
                        color: ZanaColors.paper,
                        elevation: 0,
                        child: ListTile(
                          title: Text('${r['rating']}★ · ${user?['name'] ?? 'Customer'}'),
                          subtitle: Text(
                            (r['comment'] as String?)?.isNotEmpty == true
                                ? r['comment'] as String
                                : 'No comment',
                          ),
                        ),
                      );
                    }).toList(),
                  );
                },
              ),
            ],
          );
        },
      ),
    );
  }
}
