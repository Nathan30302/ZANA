import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/map_style.dart';
import 'package:zana_customer/screens/booking_detail_screen.dart';
import 'package:zana_customer/theme.dart';

class TrackingScreen extends StatefulWidget {
  const TrackingScreen({
    super.key,
    required this.bookingId,
    this.openReviewWhenDone = false,
  });

  final String bookingId;
  final bool openReviewWhenDone;

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen>
    with SingleTickerProviderStateMixin {
  Map<String, dynamic>? booking;
  Timer? timer;
  String? error;
  ZanaMapMode mapMode = ZanaMapMode.hybrid;
  final mapController = MapController();
  bool promptedReview = false;
  late final AnimationController pulse;

  @override
  void initState() {
    super.initState();
    pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
    _load();
    timer = Timer.periodic(const Duration(seconds: 4), (_) => _load());
  }

  @override
  void dispose() {
    timer?.cancel();
    pulse.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final b = await api.getBooking(widget.bookingId);
      if (!mounted) return;
      setState(() {
        booking = b;
        error = null;
      });
      final status = b['status'] as String?;
      if (widget.openReviewWhenDone &&
          !promptedReview &&
          (status == 'COMPLETED' || status == 'RATED')) {
        promptedReview = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          _goToReview();
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => error = e.toString());
    }
  }

  void _goToReview() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => BookingDetailScreen(bookingId: widget.bookingId),
      ),
    );
  }

  Future<void> _call() async {
    final phone = booking?['contactPhone'] as String?;
    if (phone == null || phone.contains('*')) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Number unlocks after the pro accepts')),
      );
      return;
    }
    await launchUrl(Uri(scheme: 'tel', path: phone));
  }

  Future<void> _chat() async {
    final phone = booking?['contactPhone'] as String?;
    if (phone == null || phone.contains('*')) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Chat unlocks after the pro accepts')),
      );
      return;
    }
    final uri = Uri.parse('https://wa.me/${phone.replaceAll('+', '')}');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  String _coach(String status, {String? proName, int? durationMin}) {
    final name = proName ?? 'Your stylist';
    switch (status) {
      case 'REQUESTED':
        return 'Looking for $name nearby… hang tight while they accept.';
      case 'ACCEPTED':
        return '$name accepted — get ready, they’re preparing to head your way.';
      case 'ON_THE_WAY':
        return '$name is on the move. Sit tight — we’ll update as they get closer.';
      case 'CONFIRMED':
        return 'You’re checked in. Relax — service is about to start.';
      case 'IN_SERVICE':
        final mins = durationMin ?? 45;
        return 'Service in progress (~$mins min). Sit back and enjoy the vibe.';
      case 'COMPLETED':
        return 'All done — looking sharp. Tell us how it went.';
      case 'RATED':
        return 'Thanks for the review. See you next time on ZANA.';
      case 'CANCELLED':
      case 'DECLINED':
      case 'EXPIRED':
        return 'This booking ended. You can request another nearby pro anytime.';
      default:
        return 'Live booking status';
    }
  }

  String _statusTitle(String status) {
    switch (status) {
      case 'REQUESTED':
        return 'Finding your pro';
      case 'ACCEPTED':
        return 'Accepted';
      case 'ON_THE_WAY':
        return 'On the way';
      case 'CONFIRMED':
        return 'Arrived / ready';
      case 'IN_SERVICE':
        return 'In service';
      case 'COMPLETED':
        return 'Completed';
      case 'RATED':
        return 'Rated';
      default:
        return status.replaceAll('_', ' ');
    }
  }

  List<String> get _steps => const [
        'REQUESTED',
        'ACCEPTED',
        'ON_THE_WAY',
        'IN_SERVICE',
        'COMPLETED',
      ];

  @override
  Widget build(BuildContext context) {
    final b = booking;
    final status = b?['status'] as String? ?? 'REQUESTED';
    final provider = b?['provider'] as Map<String, dynamic>?;
    final service = b?['service'] as Map<String, dynamic>?;
    final proName = provider?['displayName'] as String? ?? 'Your stylist';
    final durationMin = service?['durationMin'] as int?;

    final customerLat = (b?['customerLat'] as num?)?.toDouble();
    final customerLng = (b?['customerLng'] as num?)?.toDouble();
    final providerLat = (b?['providerLat'] as num?)?.toDouble() ??
        (provider?['lat'] as num?)?.toDouble();
    final providerLng = (b?['providerLng'] as num?)?.toDouble() ??
        (provider?['lng'] as num?)?.toDouble();

    double? distKm;
    if (customerLat != null &&
        customerLng != null &&
        providerLat != null &&
        providerLng != null) {
      distKm = haversineKm(customerLat, customerLng, providerLat, providerLng);
    }

    final center = LatLng(
      providerLat ?? customerLat ?? ZanaApi.lusakaLat,
      providerLng ?? customerLng ?? ZanaApi.lusakaLng,
    );

    final markers = <Marker>[];
    if (customerLat != null && customerLng != null) {
      markers.add(
        Marker(
          point: LatLng(customerLat, customerLng),
          width: 52,
          height: 52,
          child: const _YouMarker(),
        ),
      );
    }
    if (providerLat != null && providerLng != null) {
      markers.add(
        Marker(
          point: LatLng(providerLat, providerLng),
          width: 56,
          height: 64,
          alignment: Alignment.topCenter,
          child: AnimatedBuilder(
            animation: pulse,
            builder: (context, child) {
              return Transform.translate(
                offset: Offset(0, -2 * pulse.value),
                child: child,
              );
            },
            child: _ProMarker(initial: proName.isNotEmpty ? proName[0] : 'Z'),
          ),
        ),
      );
    }

    final polylines = <Polyline>[];
    if (customerLat != null &&
        customerLng != null &&
        providerLat != null &&
        providerLng != null &&
        (status == 'ON_THE_WAY' ||
            status == 'ACCEPTED' ||
            status == 'CONFIRMED')) {
      polylines.add(
        Polyline(
          points: [
            LatLng(providerLat, providerLng),
            LatLng(customerLat, customerLng),
          ],
          color: ZanaColors.copper.withValues(alpha: 0.85),
          strokeWidth: 3.5,
          borderStrokeWidth: 1,
          borderColor: Colors.white.withValues(alpha: 0.5),
        ),
      );
    }

    final stepIdx = math.max(0, _steps.indexOf(status));
    final showEta = status == 'ON_THE_WAY' || status == 'ACCEPTED';
    final phoneReady =
        b?['contactPhone'] != null && !(b!['contactPhone'] as String).contains('*');

    return Scaffold(
      backgroundColor: ZanaColors.ink,
      body: error != null && b == null
          ? Center(
              child: Text(error!, style: const TextStyle(color: Colors.white)),
            )
          : Stack(
              children: [
                Positioned.fill(
                  child: FlutterMap(
                    mapController: mapController,
                    options: MapOptions(
                      initialCenter: center,
                      initialZoom: 14.2,
                      interactionOptions: const InteractionOptions(
                        flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
                      ),
                    ),
                    children: [
                      ...zanaMapTileLayers(context, mapMode),
                      if (polylines.isNotEmpty) PolylineLayer(polylines: polylines),
                      MarkerLayer(markers: markers),
                      ZanaMapAttribution(mode: mapMode),
                    ],
                  ),
                ),
                // Top gradient + controls
                SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
                    child: Row(
                      children: [
                        _RoundBtn(
                          icon: Icons.arrow_back_rounded,
                          onTap: () => Navigator.of(context).maybePop(),
                        ),
                        const Spacer(),
                        ZanaMapModeToggle(
                          mode: mapMode,
                          onChanged: (m) => setState(() => mapMode = m),
                        ),
                        const SizedBox(width: 8),
                        _RoundBtn(
                          icon: Icons.my_location_rounded,
                          onTap: () {
                            mapController.move(center, 14.5);
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                // Status chip floating on map
                if (showEta && distKm != null)
                  Positioned(
                    top: MediaQuery.of(context).padding.top + 64,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: AnimatedBuilder(
                        animation: pulse,
                        builder: (context, _) {
                          return Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: ZanaColors.paper.withValues(
                                alpha: 0.92 + 0.06 * pulse.value,
                              ),
                              borderRadius: BorderRadius.circular(999),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.18),
                                  blurRadius: 16,
                                ),
                              ],
                            ),
                            child: Text(
                              '${etaLabelFromKm(distKm)} · ${distKm!.toStringAsFixed(1)} km',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                // Bottom journey sheet
                Align(
                  alignment: Alignment.bottomCenter,
                  child: Container(
                    width: double.infinity,
                    decoration: const BoxDecoration(
                      color: ZanaColors.paper,
                      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                    ),
                    child: SafeArea(
                      top: false,
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(22, 16, 22, 16),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Center(
                              child: Container(
                                width: 40,
                                height: 4,
                                margin: const EdgeInsets.only(bottom: 14),
                                decoration: BoxDecoration(
                                  color: ZanaColors.line,
                                  borderRadius: BorderRadius.circular(999),
                                ),
                              ),
                            ),
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    _statusTitle(status),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 22,
                                    ),
                                  ),
                                ),
                                if (status == 'REQUESTED')
                                  FadeTransition(
                                    opacity: pulse,
                                    child: const Text(
                                      'Waiting…',
                                      style: TextStyle(
                                        color: ZanaColors.copper,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _coach(
                                status,
                                proName: proName,
                                durationMin: durationMin,
                              ),
                              style: const TextStyle(
                                color: ZanaColors.muted,
                                height: 1.35,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 14),
                            _MiniTimeline(steps: _steps, current: stepIdx, status: status),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 24,
                                  backgroundColor: ZanaColors.sand,
                                  backgroundImage: provider?['coverPhotoUrl'] != null
                                      ? NetworkImage(
                                          provider!['coverPhotoUrl'] as String,
                                        )
                                      : null,
                                  child: provider?['coverPhotoUrl'] == null
                                      ? Text(
                                          proName.isNotEmpty ? proName[0] : 'Z',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w800,
                                          ),
                                        )
                                      : null,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        proName,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 16,
                                        ),
                                      ),
                                      Text(
                                        [
                                          service?['name'] ?? 'Service',
                                          if (b?['priceZmw'] != null)
                                            'K${b!['priceZmw']}',
                                        ].join(' · '),
                                        style: const TextStyle(
                                          color: ZanaColors.muted,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton.icon(
                                    onPressed: phoneReady ? _call : null,
                                    icon: const Icon(Icons.call_rounded),
                                    label: const Text('Call'),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: FilledButton.icon(
                                    onPressed: phoneReady ? _chat : null,
                                    icon: const Icon(Icons.chat_rounded),
                                    label: const Text('WhatsApp'),
                                  ),
                                ),
                              ],
                            ),
                            if (status == 'COMPLETED' || status == 'RATED') ...[
                              const SizedBox(height: 10),
                              SizedBox(
                                width: double.infinity,
                                child: FilledButton(
                                  style: FilledButton.styleFrom(
                                    backgroundColor: ZanaColors.copper,
                                  ),
                                  onPressed: _goToReview,
                                  child: Text(
                                    status == 'RATED'
                                        ? 'View booking'
                                        : 'Rate your experience',
                                  ),
                                ),
                              ),
                            ] else ...[
                              TextButton(
                                onPressed: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => BookingDetailScreen(
                                        bookingId: widget.bookingId,
                                      ),
                                    ),
                                  );
                                },
                                child: const Text('Booking details'),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

class _MiniTimeline extends StatelessWidget {
  const _MiniTimeline({
    required this.steps,
    required this.current,
    required this.status,
  });

  final List<String> steps;
  final int current;
  final String status;

  @override
  Widget build(BuildContext context) {
    final terminal = status == 'CANCELLED' ||
        status == 'DECLINED' ||
        status == 'EXPIRED';
    return Row(
      children: [
        for (var i = 0; i < steps.length; i++) ...[
          if (i > 0)
            Expanded(
              child: Container(
                height: 3,
                color: (!terminal && i <= current)
                    ? ZanaColors.copper
                    : ZanaColors.line,
              ),
            ),
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: (!terminal && i <= current)
                  ? ZanaColors.copper
                  : ZanaColors.line,
            ),
          ),
        ],
      ],
    );
  }
}

class _YouMarker extends StatelessWidget {
  const _YouMarker();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        border: Border.all(color: ZanaColors.ink, width: 3),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.25),
            blurRadius: 8,
          ),
        ],
      ),
      child: const Icon(Icons.home_rounded, color: ZanaColors.ink, size: 22),
    );
  }
}

class _ProMarker extends StatelessWidget {
  const _ProMarker({required this.initial});

  final String initial;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 44,
          height: 44,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: ZanaColors.copper,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 3),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.35),
                blurRadius: 10,
              ),
            ],
          ),
          child: Text(
            initial.toUpperCase(),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 16,
            ),
          ),
        ),
        CustomPaint(
          size: const Size(12, 8),
          painter: _PinTipPainter(ZanaColors.copper),
        ),
      ],
    );
  }
}

class _PinTipPainter extends CustomPainter {
  _PinTipPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final path = ui.Path()
      ..moveTo(0, 0)
      ..lineTo(size.width / 2, size.height)
      ..lineTo(size.width, 0)
      ..close();
    canvas.drawPath(path, Paint()..color = color);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _RoundBtn extends StatelessWidget {
  const _RoundBtn({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: ZanaColors.paper.withValues(alpha: 0.94),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 42,
          height: 42,
          child: Icon(icon, size: 20, color: ZanaColors.ink),
        ),
      ),
    );
  }
}
