import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
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
    with TickerProviderStateMixin {
  Map<String, dynamic>? booking;
  Timer? timer;
  String? error;
  ZanaMapMode mapMode = ZanaMapMode.hybrid;
  final mapController = MapController();
  bool promptedReview = false;
  late final AnimationController pulse;

  /// Smooth live position between GPS samples (Yango-style glide).
  LatLng? _displayPro;
  LatLng? _fromPro;
  LatLng? _toPro;
  double _moveT = 1;
  DateTime? _moveStarted;
  static const _glideMs = 3800;

  DrivingRoute? _route;
  String? _routeKey;
  bool _followPro = true;
  bool _didFit = false;
  DateTime? _lastRouteFetch;
  Ticker? _glideTicker;

  @override
  void initState() {
    super.initState();
    pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
    _glideTicker = createTicker(_onGlideTick)..start();
    _load();
    timer = Timer.periodic(const Duration(seconds: 3), (_) => _load());
  }

  @override
  void dispose() {
    timer?.cancel();
    _glideTicker?.dispose();
    pulse.dispose();
    super.dispose();
  }

  void _onGlideTick(Duration _) {
    if (_fromPro == null || _toPro == null || _moveT >= 1) return;
    final started = _moveStarted;
    if (started == null) return;
    final t =
        (DateTime.now().difference(started).inMilliseconds / _glideMs)
            .clamp(0.0, 1.0);
    final eased = Curves.easeInOut.transform(t);
    final next = lerpLatLng(_fromPro!, _toPro!, eased);
    if (!mounted) return;
    setState(() {
      _moveT = t;
      _displayPro = next;
    });
    if (_followPro &&
        (booking?['status'] == 'ON_THE_WAY' ||
            booking?['status'] == 'ACCEPTED')) {
      mapController.move(next, mapController.camera.zoom);
    }
  }

  void _setProTarget(LatLng target) {
    final current = _displayPro ?? _toPro;
    if (current == null) {
      _displayPro = target;
      _fromPro = target;
      _toPro = target;
      _moveT = 1;
      return;
    }
    final jumped = haversineKm(
          current.latitude,
          current.longitude,
          target.latitude,
          target.longitude,
        ) ??
        0;
    // Ignore tiny GPS noise; restart glide for real movement.
    if (jumped < 0.012) {
      _toPro = target;
      return;
    }
    _fromPro = current;
    _toPro = target;
    _moveT = 0;
    _moveStarted = DateTime.now();
  }

  Future<void> _load() async {
    try {
      final b = await api.getBooking(widget.bookingId);
      if (!mounted) return;

      final provider = b['provider'] as Map<String, dynamic>?;
      final customerLat = (b['customerLat'] as num?)?.toDouble();
      final customerLng = (b['customerLng'] as num?)?.toDouble();
      final providerLat = (b['providerLat'] as num?)?.toDouble() ??
          (provider?['lat'] as num?)?.toDouble();
      final providerLng = (b['providerLng'] as num?)?.toDouble() ??
          (provider?['lng'] as num?)?.toDouble();
      final status = b['status'] as String?;

      if (providerLat != null && providerLng != null) {
        _setProTarget(LatLng(providerLat, providerLng));
      }

      setState(() {
        booking = b;
        error = null;
      });

      if (customerLat != null &&
          customerLng != null &&
          providerLat != null &&
          providerLng != null &&
          (status == 'ACCEPTED' ||
              status == 'ON_THE_WAY' ||
              status == 'CONFIRMED')) {
        await _ensureRoute(
          fromLat: providerLat,
          fromLng: providerLng,
          toLat: customerLat,
          toLng: customerLng,
        );
        if (!_didFit && mounted) {
          _didFit = true;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (!mounted) return;
            fitMapToPins(
              mapController,
              LatLng(providerLat, providerLng),
              LatLng(customerLat, customerLng),
            );
          });
        }
      }

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

  Future<void> _ensureRoute({
    required double fromLat,
    required double fromLng,
    required double toLat,
    required double toLng,
  }) async {
    final key =
        '${fromLat.toStringAsFixed(4)},${fromLng.toStringAsFixed(4)}→${toLat.toStringAsFixed(4)},${toLng.toStringAsFixed(4)}';
    final now = DateTime.now();
    if (_routeKey == key && _route != null) return;
    if (_lastRouteFetch != null &&
        now.difference(_lastRouteFetch!) < const Duration(seconds: 12) &&
        _route != null) {
      return;
    }
    _lastRouteFetch = now;
    final route = await fetchDrivingRoute(
      fromLat: fromLat,
      fromLng: fromLng,
      toLat: toLat,
      toLng: toLng,
    );
    if (!mounted || route == null) return;
    setState(() {
      _route = route;
      _routeKey = key;
    });
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
        return '$name accepted. They’re getting ready — live location updates as they head out.';
      case 'ON_THE_WAY':
        return '$name is coming to you. Watch them move on the map in real time.';
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
        return 'Pro accepted';
      case 'ON_THE_WAY':
        return 'On the way to you';
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

  String? _freshnessLabel(Map<String, dynamic>? b) {
    final raw = b?['providerLocationUpdatedAt'] as String?;
    if (raw == null) return null;
    final at = DateTime.tryParse(raw)?.toLocal();
    if (at == null) return null;
    final secs = DateTime.now().difference(at).inSeconds;
    if (secs < 20) return 'Live · just now';
    if (secs < 60) return 'Live · ${secs}s ago';
    final mins = (secs / 60).floor();
    if (mins < 5) return 'Updated ${mins}m ago';
    return 'Location may be stale';
  }

  List<String> get _steps => const [
        'REQUESTED',
        'ACCEPTED',
        'ON_THE_WAY',
        'IN_SERVICE',
        'COMPLETED',
      ];

  void _recenter() {
    final b = booking;
    final customerLat = (b?['customerLat'] as num?)?.toDouble();
    final customerLng = (b?['customerLng'] as num?)?.toDouble();
    final pro = _displayPro;
    if (pro != null && customerLat != null && customerLng != null) {
      setState(() => _followPro = true);
      fitMapToPins(mapController, pro, LatLng(customerLat, customerLng));
      return;
    }
    if (pro != null) {
      mapController.move(pro, 15);
      return;
    }
    if (customerLat != null && customerLng != null) {
      mapController.move(LatLng(customerLat, customerLng), 14.5);
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = booking;
    final status = b?['status'] as String? ?? 'REQUESTED';
    final provider = b?['provider'] as Map<String, dynamic>?;
    final service = b?['service'] as Map<String, dynamic>?;
    final proName = provider?['displayName'] as String? ?? 'Your stylist';
    final durationMin = service?['durationMin'] as int?;
    final mode = service?['mode'] as String?;

    final customerLat = (b?['customerLat'] as num?)?.toDouble();
    final customerLng = (b?['customerLng'] as num?)?.toDouble();
    final providerLat = (b?['providerLat'] as num?)?.toDouble() ??
        (provider?['lat'] as num?)?.toDouble();
    final providerLng = (b?['providerLng'] as num?)?.toDouble() ??
        (provider?['lng'] as num?)?.toDouble();

    final proPoint = _displayPro ??
        (providerLat != null && providerLng != null
            ? LatLng(providerLat, providerLng)
            : null);
    final youPoint = customerLat != null && customerLng != null
        ? LatLng(customerLat, customerLng)
        : null;

    double? distKm;
    if (youPoint != null && proPoint != null) {
      distKm = _route?.distanceKm ??
          haversineKm(
            youPoint.latitude,
            youPoint.longitude,
            proPoint.latitude,
            proPoint.longitude,
          );
    }

    final center = proPoint ??
        youPoint ??
        const LatLng(ZanaApi.lusakaLat, ZanaApi.lusakaLng);

    double? heading;
    if (_fromPro != null && _toPro != null && _moveT < 1) {
      heading = bearingDegrees(_fromPro!, _toPro!);
    } else if (proPoint != null && youPoint != null) {
      heading = bearingDegrees(proPoint, youPoint);
    }

    final markers = <Marker>[];
    if (youPoint != null) {
      markers.add(
        Marker(
          point: youPoint,
          width: 52,
          height: 52,
          child: const _YouMarker(),
        ),
      );
    }
    if (proPoint != null) {
      markers.add(
        Marker(
          point: proPoint,
          width: 64,
          height: 72,
          alignment: Alignment.topCenter,
          child: AnimatedBuilder(
            animation: pulse,
            builder: (context, child) {
              return Transform.translate(
                offset: Offset(0, -2 * pulse.value),
                child: child,
              );
            },
            child: _ProMarker(
              initial: proName.isNotEmpty ? proName[0] : 'Z',
              heading: heading,
              moving: status == 'ON_THE_WAY' || status == 'ACCEPTED',
            ),
          ),
        ),
      );
    }

    final polylines = <Polyline>[];
    final showRoute = status == 'ON_THE_WAY' ||
        status == 'ACCEPTED' ||
        status == 'CONFIRMED';
    if (showRoute && youPoint != null && proPoint != null) {
      final points = (_route?.points.isNotEmpty == true)
          ? _route!.points
          : [proPoint, youPoint];
      polylines.add(
        Polyline(
          points: points,
          color: ZanaColors.copper.withValues(alpha: 0.9),
          strokeWidth: 4.2,
          borderStrokeWidth: 1.4,
          borderColor: Colors.white.withValues(alpha: 0.55),
        ),
      );
    }

    final stepIdx = math.max(0, _steps.indexOf(status));
    final showEta = status == 'ON_THE_WAY' || status == 'ACCEPTED';
    final phoneReady = b?['contactPhone'] != null &&
        !(b!['contactPhone'] as String).contains('*');
    final freshness = _freshnessLabel(b);
    final etaText = _route != null
        ? etaLabelFromSeconds(_route!.durationSeconds)
        : etaLabelFromKm(distKm);

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
                      onPositionChanged: (pos, hasGesture) {
                        if (hasGesture && _followPro) {
                          setState(() => _followPro = false);
                        }
                      },
                      interactionOptions: const InteractionOptions(
                        flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
                      ),
                    ),
                    children: [
                      ...zanaMapTileLayers(context, mapMode),
                      if (polylines.isNotEmpty)
                        PolylineLayer(polylines: polylines),
                      MarkerLayer(markers: markers),
                      ZanaMapAttribution(mode: mapMode),
                    ],
                  ),
                ),
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
                          icon: _followPro
                              ? Icons.near_me_rounded
                              : Icons.my_location_rounded,
                          onTap: _recenter,
                        ),
                      ],
                    ),
                  ),
                ),
                if (showEta && distKm != null)
                  Positioned(
                    top: MediaQuery.of(context).padding.top + 64,
                    left: 16,
                    right: 16,
                    child: Center(
                      child: AnimatedBuilder(
                        animation: pulse,
                        builder: (context, _) {
                          return Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 11,
                            ),
                            decoration: BoxDecoration(
                              color: ZanaColors.paper.withValues(
                                alpha: 0.94 + 0.04 * pulse.value,
                              ),
                              borderRadius: BorderRadius.circular(18),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.2),
                                  blurRadius: 18,
                                ),
                              ],
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  '$etaText · ${distKm!.toStringAsFixed(1)} km',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 15,
                                  ),
                                ),
                                if (freshness != null) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    freshness,
                                    style: TextStyle(
                                      color: freshness.contains('stale')
                                          ? Colors.orange.shade800
                                          : ZanaColors.muted,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                Align(
                  alignment: Alignment.bottomCenter,
                  child: Container(
                    width: double.infinity,
                    decoration: const BoxDecoration(
                      color: ZanaColors.paper,
                      borderRadius:
                          BorderRadius.vertical(top: Radius.circular(28)),
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
                                  )
                                else if (status == 'ON_THE_WAY')
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 5,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFECFDF5),
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: const Text(
                                      'Live',
                                      style: TextStyle(
                                        color: Color(0xFF047857),
                                        fontWeight: FontWeight.w800,
                                        fontSize: 12,
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
                            if (mode == 'COMES_TO_YOU' &&
                                (status == 'ON_THE_WAY' ||
                                    status == 'ACCEPTED')) ...[
                              const SizedBox(height: 8),
                              Text(
                                'Your pro is coming to your pin — you don’t need to go anywhere.',
                                style: TextStyle(
                                  color: ZanaColors.ink.withValues(alpha: 0.75),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                            const SizedBox(height: 14),
                            _MiniTimeline(
                              steps: _steps,
                              current: stepIdx,
                              status: status,
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 24,
                                  backgroundColor: ZanaColors.sand,
                                  backgroundImage:
                                      provider?['coverPhotoUrl'] != null
                                          ? NetworkImage(
                                              provider!['coverPhotoUrl']
                                                  as String,
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
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
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
                            if (status == 'COMPLETED' ||
                                status == 'RATED') ...[
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
  const _ProMarker({
    required this.initial,
    this.heading,
    this.moving = false,
  });

  final String initial;
  final double? heading;
  final bool moving;

  @override
  Widget build(BuildContext context) {
    final angle = heading == null ? 0.0 : (heading! * math.pi / 180);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Transform.rotate(
          angle: moving && heading != null ? angle : 0,
          child: Container(
            width: 48,
            height: 48,
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
            child: moving
                ? const Icon(
                    Icons.navigation_rounded,
                    color: Colors.white,
                    size: 22,
                  )
                : Text(
                    initial.toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                    ),
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
