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
          final name = p['displayName'] as String? ?? 'Pro';

          return CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 260,
                pinned: true,
                stretch: true,
                backgroundColor: ZanaColors.espresso,
                foregroundColor: Colors.white,
                actions: [
                  IconButton(
                    tooltip: favorited ? 'Unfavorite' : 'Favorite',
                    onPressed: _toggleFavorite,
                    icon: Icon(
                      favorited ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                      color: favorited ? ZanaColors.gold : Colors.white,
                    ),
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  stretchModes: const [StretchMode.zoomBackground],
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (cover != null)
                        Image.network(
                          cover,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _CoverFallback(name: name),
                        )
                      else
                        _CoverFallback(name: name),
                      DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              ZanaColors.espresso.withValues(alpha: 0.85),
                            ],
                            stops: const [0.35, 1],
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
                              style: ZanaText.display(context).copyWith(
                                fontSize: 28,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${p['area']} · ${p['type']}'
                              '${count > 0 ? ' · ${rating.toStringAsFixed(1)}★ ($count reviews)' : ' · New on ZANA'}',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.85),
                                fontWeight: FontWeight.w500,
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
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 100),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (bio != null && bio.isNotEmpty) ...[
                        Text('About', style: ZanaText.sectionTitle(context)),
                        const SizedBox(height: 8),
                        Text(bio, style: ZanaText.subtitle(context)),
                        const SizedBox(height: 24),
                      ],
                      if (photos.isNotEmpty) ...[
                        Text('Gallery', style: ZanaText.sectionTitle(context)),
                        const SizedBox(height: 12),
                        SizedBox(
                          height: 100,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: photos.length,
                            separatorBuilder: (_, __) => const SizedBox(width: 10),
                            itemBuilder: (context, i) {
                              final url = (photos[i] as Map)['url'] as String?;
                              if (url == null) return const SizedBox.shrink();
                              return ClipRRect(
                                borderRadius: BorderRadius.circular(14),
                                child: Image.network(
                                  url,
                                  width: 100,
                                  height: 100,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(
                                    width: 100,
                                    color: ZanaColors.blush,
                                    child: const Icon(Icons.image_outlined),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],
                      Text('Services', style: ZanaText.sectionTitle(context)),
                      const SizedBox(height: 12),
                      ...services.map((s) {
                        final svc = s as Map<String, dynamic>;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Material(
                            color: ZanaColors.paper,
                            borderRadius: BorderRadius.circular(16),
                            child: InkWell(
                              onTap: () => _book(svc),
                              borderRadius: BorderRadius.circular(16),
                              child: Ink(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: ZanaColors.ink.withValues(alpha: 0.06),
                                  ),
                                  boxShadow: [ZanaDecorations.softShadow],
                                ),
                                padding: const EdgeInsets.all(16),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 44,
                                      height: 44,
                                      decoration: BoxDecoration(
                                        color: ZanaColors.blush,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: const Icon(
                                        Icons.spa_outlined,
                                        color: ZanaColors.copper,
                                        size: 22,
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            svc['name'] as String,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w700,
                                              fontSize: 15,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            '${svc['durationMin']} min · ${svc['mode']}',
                                            style: ZanaText.subtitle(context).copyWith(
                                              fontSize: 13,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      'K${svc['priceZmw']}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 16,
                                        color: ZanaColors.copper,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      }),
                      const SizedBox(height: 24),
                      Text('Reviews', style: ZanaText.sectionTitle(context)),
                      const SizedBox(height: 12),
                      FutureBuilder<List<dynamic>>(
                        future: reviewsFuture,
                        builder: (context, rSnap) {
                          if (!rSnap.hasData) {
                            return const LinearProgressIndicator(
                              color: ZanaColors.copper,
                            );
                          }
                          final reviews = rSnap.data!;
                          if (reviews.isEmpty) {
                            return Text(
                              'No reviews yet — be the first after your appointment.',
                              style: ZanaText.subtitle(context),
                            );
                          }
                          return Column(
                            children: reviews.map((raw) {
                              final r = raw as Map<String, dynamic>;
                              final user = r['user'] as Map<String, dynamic>?;
                              return Container(
                                margin: const EdgeInsets.only(bottom: 10),
                                padding: const EdgeInsets.all(16),
                                decoration: ZanaDecorations.premiumCard(radius: 16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          '${r['rating']}★',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w800,
                                            color: ZanaColors.copper,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          user?['name'] as String? ?? 'Customer',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                    if ((r['comment'] as String?)?.isNotEmpty ==
                                        true) ...[
                                      const SizedBox(height: 6),
                                      Text(
                                        r['comment'] as String,
                                        style: ZanaText.subtitle(context),
                                      ),
                                    ],
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

class _CoverFallback extends StatelessWidget {
  const _CoverFallback({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF3D342E), ZanaColors.espresso],
        ),
      ),
      child: Center(
        child: Text(
          name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'Z',
          style: ZanaText.display(context).copyWith(
            fontSize: 80,
            color: ZanaColors.gold.withValues(alpha: 0.25),
          ),
        ),
      ),
    );
  }
}
