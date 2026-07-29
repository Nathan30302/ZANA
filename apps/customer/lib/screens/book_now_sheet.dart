import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/auth_sheet.dart';
import 'package:zana_customer/screens/booking_sheet.dart';
import 'package:zana_customer/screens/tracking_screen.dart';
import 'package:zana_customer/theme.dart';

/// On-demand booking: pick a nearby online pro + service, request now, open live map.
Future<void> showBookNowFlow(
  BuildContext context, {
  required double userLat,
  required double userLng,
  String? category,
  String? excludeProviderId,
}) async {
  if (api.token == null) {
    final ok = await showAuthSheet(context);
    if (!ok || !context.mounted) return;
  }

  List<dynamic> online = [];
  try {
    online = await api.listProviders(
      category: category == 'ALL' ? null : category,
      lat: userLat,
      lng: userLng,
      online: true,
      radiusKm: 12,
    );
    if (excludeProviderId != null) {
      online = online
          .where((raw) => (raw as Map)['id'] != excludeProviderId)
          .toList();
    }
  } catch (e) {
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Could not load nearby pros: $e')),
    );
    return;
  }

  if (!context.mounted) return;

  final picked = await showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    isScrollControlled: true,
    backgroundColor: ZanaColors.paper,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (ctx) {
      return DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.62,
        minChildSize: 0.4,
        maxChildSize: 0.92,
        builder: (ctx, scroll) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(top: 12, bottom: 8),
                  decoration: BoxDecoration(
                    color: ZanaColors.line,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
              const Padding(
                padding: EdgeInsets.fromLTRB(20, 4, 20, 4),
                child: Text(
                  'Book now',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 20,
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 10),
                child: Material(
                  color: ZanaColors.ink,
                  borderRadius: BorderRadius.circular(16),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () async {
                      var cat = category;
                      if (cat == null || cat == 'ALL') {
                        const cats = [
                          'BARBER',
                          'SALON',
                          'NAILS',
                          'BRIDAL',
                          'MOBILE',
                        ];
                        cat = await showModalBottomSheet<String>(
                          context: ctx,
                          backgroundColor: ZanaColors.paper,
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.vertical(
                              top: Radius.circular(20),
                            ),
                          ),
                          builder: (sctx) => SafeArea(
                            child: ListView(
                              shrinkWrap: true,
                              padding: const EdgeInsets.all(16),
                              children: [
                                const Text(
                                  'What do you need?',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 17,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                for (final c in cats)
                                  ListTile(
                                    title: Text(c.replaceAll('_', ' ')),
                                    onTap: () => Navigator.pop(sctx, c),
                                  ),
                              ],
                            ),
                          ),
                        );
                        if (cat == null) return;
                      }
                      if (!ctx.mounted) return;
                      Navigator.pop(ctx, {'broadcast': true, 'category': cat});
                    },
                    child: const Padding(
                      padding: EdgeInsets.fromLTRB(16, 14, 16, 14),
                      child: Row(
                        children: [
                          Icon(Icons.bolt_rounded, color: ZanaColors.copper),
                          SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Any nearby online pro',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 15,
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Open request — first to accept gets the job',
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Icon(Icons.chevron_right_rounded, color: Colors.white54),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const Padding(
                padding: EdgeInsets.fromLTRB(20, 4, 20, 8),
                child: Text(
                  'Or pick someone',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: ZanaColors.muted,
                    fontSize: 13,
                  ),
                ),
              ),
              Expanded(
                child: online.isEmpty
                    ? const Center(
                        child: Padding(
                          padding: EdgeInsets.all(24),
                          child: Text(
                            'No specific pros online in range — try an open request above.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: ZanaColors.muted),
                          ),
                        ),
                      )
                    : ListView.separated(
                  controller: scroll,
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                  itemCount: online.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final p = online[i] as Map<String, dynamic>;
                    final services =
                        (p['services'] as List?)?.cast<Map<String, dynamic>>() ??
                            const [];
                    final km = (p['distanceKm'] as num?)?.toDouble();
                    final name = p['displayName'] as String? ?? 'Pro';
                    final cover = p['coverPhotoUrl'] as String?;
                    final rating = (p['ratingAvg'] as num?)?.toDouble() ?? 0;
                    final count = p['ratingCount'] as int? ?? 0;
                    return Material(
                      color: ZanaColors.sand,
                      borderRadius: BorderRadius.circular(16),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap: () async {
                          if (services.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('This pro has no services yet'),
                              ),
                            );
                            return;
                          }
                          Map<String, dynamic> svc = services.first;
                          if (services.length > 1) {
                            final chosen =
                                await showModalBottomSheet<Map<String, dynamic>>(
                              context: context,
                              backgroundColor: ZanaColors.paper,
                              shape: const RoundedRectangleBorder(
                                borderRadius: BorderRadius.vertical(
                                  top: Radius.circular(20),
                                ),
                              ),
                              builder: (sctx) {
                                return SafeArea(
                                  child: ListView(
                                    shrinkWrap: true,
                                    padding: const EdgeInsets.all(16),
                                    children: [
                                      const Text(
                                        'Choose a service',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 17,
                                        ),
                                      ),
                                      const SizedBox(height: 10),
                                      for (final s in services)
                                        ListTile(
                                          title: Text(s['name'] as String? ?? ''),
                                          subtitle: Text(
                                            'K${s['priceZmw']}'
                                            '${s['durationMin'] != null ? ' · ${s['durationMin']} min' : ''}',
                                          ),
                                          onTap: () =>
                                              Navigator.pop(sctx, s),
                                        ),
                                    ],
                                  ),
                                );
                              },
                            );
                            if (chosen == null) return;
                            svc = chosen;
                          }
                          if (!context.mounted) return;
                          Navigator.pop(ctx, {
                            'provider': p,
                            'service': svc,
                          });
                        },
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: SizedBox(
                                  width: 56,
                                  height: 56,
                                  child: cover != null
                                      ? Image.network(
                                          cover,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) =>
                                              const ColoredBox(
                                            color: ZanaColors.line,
                                            child: Icon(Icons.content_cut),
                                          ),
                                        )
                                      : const ColoredBox(
                                          color: ZanaColors.line,
                                          child: Icon(Icons.content_cut),
                                        ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      name,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 15,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      [
                                        p['area'],
                                        if (km != null)
                                          '${km.toStringAsFixed(1)} km',
                                        if (count > 0)
                                          '${rating.toStringAsFixed(1)}★ ($count)',
                                        'Online',
                                      ].whereType<Object>().join(' · '),
                                      style: const TextStyle(
                                        color: ZanaColors.muted,
                                        fontSize: 12,
                                      ),
                                    ),
                                    if (services.isNotEmpty)
                                      Text(
                                        'From K${services.map((s) => s['priceZmw'] as int? ?? 0).reduce((a, b) => a < b ? a : b)}',
                                        style: const TextStyle(
                                          color: ZanaColors.copper,
                                          fontWeight: FontWeight.w700,
                                          fontSize: 12,
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              const Icon(
                                Icons.chevron_right_rounded,
                                color: ZanaColors.muted,
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      );
    },
  );

  if (picked == null || !context.mounted) return;

  double? lat = userLat;
  double? lng = userLng;
  try {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (enabled) {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm != LocationPermission.denied &&
          perm != LocationPermission.deniedForever) {
        final pos = await Geolocator.getCurrentPosition();
        lat = pos.latitude;
        lng = pos.longitude;
      }
    }
  } catch (_) {}

  if (picked['broadcast'] == true) {
    if (!context.mounted) return;
    final draft = await showBookingSheet(
      context,
      serviceName: '${(picked['category'] as String).replaceAll('_', ' ')} · open request',
      serviceMode: 'COMES_TO_YOU',
      preferAsap: true,
    );
    if (draft == null || !context.mounted) return;
    try {
      final booking = await api.createBroadcastBooking(
        category: picked['category'] as String,
        customerLat: draft.lat ?? lat ?? userLat,
        customerLng: draft.lng ?? lng ?? userLng,
        customerAddress: draft.address,
        notes: draft.notes,
      );
      if (!context.mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => TrackingScreen(
            bookingId: booking['id'] as String,
            openReviewWhenDone: true,
          ),
        ),
      );
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Request failed: $e')),
      );
    }
    return;
  }

  final provider = picked['provider'] as Map<String, dynamic>;
  final service = picked['service'] as Map<String, dynamic>;
  final mode = service['mode'] as String? ?? 'AT_SHOP';

  if (!context.mounted) return;
  final draft = await showBookingSheet(
    context,
    serviceName: service['name'] as String? ?? 'Service',
    serviceMode: mode,
    priceZmw: service['priceZmw'] as int?,
    durationMin: service['durationMin'] as int?,
    preferAsap: true,
  );
  if (draft == null || !context.mounted) return;

  try {
    final booking = await api.createBooking(
      providerId: provider['id'] as String,
      serviceId: service['id'] as String,
      scheduledAt: draft.scheduledAt,
      customerAddress: draft.address,
      customerLat: draft.lat ?? lat,
      customerLng: draft.lng ?? lng,
      notes: draft.notes,
    );
    if (!context.mounted) return;
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => TrackingScreen(
          bookingId: booking['id'] as String,
          openReviewWhenDone: true,
        ),
      ),
    );
  } catch (e) {
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Request failed: $e')),
    );
  }
}
