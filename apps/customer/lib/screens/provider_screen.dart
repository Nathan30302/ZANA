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
  bool favorited = false;

  @override
  void initState() {
    super.initState();
    future = api.getProvider(widget.providerId);
    reviewsFuture = api.providerReviews(widget.providerId);
    _loadFavorite();
  }

  Future<void> _loadFavorite() async {
    if (api.token == null) return;
    final ok = await api.isFavorite(widget.providerId);
    if (mounted) setState(() => favorited = ok);
  }

  Future<void> _toggleFavorite() async {
    if (api.token == null) {
      final ok = await showAuthSheet(context);
      if (!ok) return;
    }
    try {
      if (favorited) {
        await api.removeFavorite(widget.providerId);
        setState(() => favorited = false);
      } else {
        await api.addFavorite(widget.providerId);
        setState(() => favorited = true);
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
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
      priceZmw: svc['priceZmw'] as int?,
      durationMin: svc['durationMin'] as int?,
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
          builder: (_) =>
              BookingDetailScreen(bookingId: booking['id'] as String),
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
      backgroundColor: ZanaColors.cream,
      body: FutureBuilder<Map<String, dynamic>>(
        future: future,
        builder: (context, snap) {
          if (!snap.hasData) {
            return const Center(
              child: CircularProgressIndicator(color: ZanaColors.copper),
            );
          }
          final p = snap.data!;
          final services = (p['services'] as List<dynamic>? ?? []);
          final photos = (p['photos'] as List<dynamic>? ?? []);
          final cover = p['coverPhotoUrl'] as String?;
          final rating = (p['ratingAvg'] as num?)?.toDouble() ?? 0;
          final count = p['ratingCount'] as int? ?? 0;
          final bio = p['bio'] as String?;
          final online = p['isOnline'] == true;
          final name = p['displayName'] as String? ?? 'Pro';

          return CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 260,
                pinned: true,
                backgroundColor: ZanaColors.cream,
                foregroundColor: ZanaColors.ink,
                actions: [
                  IconButton(
                    tooltip: favorited ? 'Unfavorite' : 'Favorite',
                    onPressed: _toggleFavorite,
                    icon: Icon(
                      favorited ? Icons.favorite : Icons.favorite_border,
                      color: favorited ? ZanaColors.copper : ZanaColors.ink,
                    ),
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (cover != null)
                        Image.network(
                          cover,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) =>
                              const ColoredBox(color: ZanaColors.sand),
                        )
                      else
                        const ColoredBox(color: ZanaColors.sand),
                      DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.black.withValues(alpha: 0.05),
                              Colors.black.withValues(alpha: 0.55),
                            ],
                          ),
                        ),
                      ),
                      Positioned(
                        left: 20,
                        right: 20,
                        bottom: 20,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 28,
                                height: 1.05,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '${p['area']} · ${p['type']}',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.85),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              color: online
                                  ? const Color(0xFFECFDF5)
                                  : ZanaColors.sand,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              online ? 'Online now' : 'Offline',
                              style: TextStyle(
                                color: online
                                    ? const Color(0xFF047857)
                                    : ZanaColors.muted,
                                fontWeight: FontWeight.w700,
                                fontSize: 12,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            count > 0
                                ? '${rating.toStringAsFixed(1)}★ · $count reviews'
                                : 'New on ZANA',
                            style: TextStyle(
                              color: count > 0
                                  ? ZanaColors.copper
                                  : ZanaColors.muted,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                      if (p['hours'] != null) ...[
                        const SizedBox(height: 10),
                        Text(
                          'Hours · ${p['hours']}',
                          style: const TextStyle(color: ZanaColors.muted),
                        ),
                      ],
                      if (bio != null && bio.isNotEmpty) ...[
                        const SizedBox(height: 14),
                        Text(bio, style: const TextStyle(height: 1.45)),
                      ],
                      if (photos.isNotEmpty) ...[
                        const SizedBox(height: 20),
                        const Text(
                          'Portfolio',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 18,
                          ),
                        ),
                        const SizedBox(height: 10),
                        SizedBox(
                          height: 120,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: photos.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(width: 10),
                            itemBuilder: (context, i) {
                              final url =
                                  (photos[i] as Map)['url'] as String?;
                              if (url == null) return const SizedBox.shrink();
                              return ClipRRect(
                                borderRadius: BorderRadius.circular(14),
                                child: Image.network(
                                  url,
                                  width: 160,
                                  height: 120,
                                  fit: BoxFit.cover,
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                      const SizedBox(height: 22),
                      const Text(
                        'Services',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 18,
                        ),
                      ),
                      const SizedBox(height: 10),
                      ...services.map((s) {
                        final svc = s as Map<String, dynamic>;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          decoration: BoxDecoration(
                            color: ZanaColors.paper,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: ZanaColors.ink.withValues(alpha: 0.05),
                            ),
                          ),
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 4,
                            ),
                            title: Text(
                              svc['name'] as String,
                              style: const TextStyle(fontWeight: FontWeight.w700),
                            ),
                            subtitle: Text(
                              '${svc['durationMin']} min · ${svc['mode'] == 'COMES_TO_YOU' ? 'Comes to you' : 'At shop'}',
                            ),
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  'K${svc['priceZmw']}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                    color: ZanaColors.copper,
                                  ),
                                ),
                                const Text(
                                  'Book',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: ZanaColors.ink,
                                  ),
                                ),
                              ],
                            ),
                            onTap: () => _book(svc),
                          ),
                        );
                      }),
                      const SizedBox(height: 18),
                      const Text(
                        'Reviews',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 18,
                        ),
                      ),
                      const SizedBox(height: 10),
                      FutureBuilder<List<dynamic>>(
                        future: reviewsFuture,
                        builder: (context, rSnap) {
                          if (!rSnap.hasData) {
                            return const LinearProgressIndicator();
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
                              return Container(
                                margin: const EdgeInsets.only(bottom: 10),
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: ZanaColors.paper,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color:
                                        ZanaColors.ink.withValues(alpha: 0.05),
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${r['rating']}★ · ${user?['name'] ?? 'Customer'}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      (r['comment'] as String?)?.isNotEmpty ==
                                              true
                                          ? r['comment'] as String
                                          : 'No comment',
                                      style: const TextStyle(
                                        color: ZanaColors.muted,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
