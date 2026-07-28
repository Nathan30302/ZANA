import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/provider_screen.dart';
import 'package:zana_customer/theme.dart';

class NearbyMapScreen extends StatefulWidget {
  const NearbyMapScreen({
    super.key,
    required this.providers,
    this.userLat = ZanaApi.lusakaLat,
    this.userLng = ZanaApi.lusakaLng,
    this.embedded = false,
    this.onRefresh,
  });

  final List<dynamic> providers;
  final double userLat;
  final double userLng;
  final bool embedded;
  final Future<void> Function()? onRefresh;

  @override
  State<NearbyMapScreen> createState() => _NearbyMapScreenState();
}

class _NearbyMapScreenState extends State<NearbyMapScreen> {
  final mapController = MapController();
  String? selectedId;
  String category = 'ALL';
  bool fitted = false;

  List<Map<String, dynamic>> get _items {
    return widget.providers
        .cast<Map<String, dynamic>>()
        .where((p) {
          final lat = p['lat'];
          final lng = p['lng'];
          if (lat == null || lng == null) return false;
          if (category == 'ALL') return true;
          final services = (p['services'] as List?) ?? const [];
          if (services.isEmpty) {
            // Fall back to provider type when services aren't embedded.
            final type = (p['type'] as String?) ?? '';
            if (category == 'BARBER') return type == 'BARBERSHOP';
            if (category == 'SALON') return type == 'SALON';
            if (category == 'MOBILE') return type == 'INDEPENDENT';
            return true;
          }
          return services.any((s) {
            final m = s as Map<String, dynamic>;
            return m['category'] == category ||
                (category == 'MOBILE' && m['mode'] == 'COMES_TO_YOU');
          });
        })
        .toList();
  }

  Map<String, dynamic>? get _selected {
    final id = selectedId;
    if (id == null) return null;
    for (final p in _items) {
      if (p['id'] == id) return p;
    }
    return null;
  }

  @override
  void didUpdateWidget(covariant NearbyMapScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.providers != widget.providers ||
        oldWidget.userLat != widget.userLat ||
        oldWidget.userLng != widget.userLng) {
      fitted = false;
      WidgetsBinding.instance.addPostFrameCallback((_) => _fitToContent());
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _fitToContent());
  }

  void _fitToContent() {
    if (!mounted || fitted) return;
    final points = <LatLng>[
      LatLng(widget.userLat, widget.userLng),
      ..._items.map((p) {
        return LatLng(
          (p['lat'] as num).toDouble(),
          (p['lng'] as num).toDouble(),
        );
      }),
    ];
    if (points.length == 1) {
      mapController.move(points.first, 13);
      fitted = true;
      return;
    }
    try {
      final bounds = LatLngBounds.fromPoints(points);
      mapController.fitCamera(
        CameraFit.bounds(
          bounds: bounds,
          padding: const EdgeInsets.fromLTRB(48, 140, 48, 180),
          maxZoom: 14.5,
        ),
      );
      fitted = true;
    } catch (_) {}
  }

  void _recenter() {
    mapController.move(LatLng(widget.userLat, widget.userLng), 13.2);
  }

  Future<void> _openProvider(String id) async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => ProviderScreen(providerId: id)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final items = _items;
    final selected = _selected;

    final markers = <Marker>[
      Marker(
        point: LatLng(widget.userLat, widget.userLng),
        width: 54,
        height: 54,
        alignment: Alignment.center,
        child: const _YouPin(),
      ),
      ...items.map((p) {
        final id = p['id'] as String;
        final online = p['isOnline'] == true;
        final selectedPin = selectedId == id;
        final name = p['displayName'] as String? ?? 'P';
        return Marker(
          point: LatLng(
            (p['lat'] as num).toDouble(),
            (p['lng'] as num).toDouble(),
          ),
          width: selectedPin ? 58 : 48,
          height: selectedPin ? 66 : 56,
          alignment: Alignment.topCenter,
          child: GestureDetector(
            onTap: () => setState(() => selectedId = id),
            child: _ProPin(
              label: name.isNotEmpty ? name[0].toUpperCase() : 'Z',
              online: online,
              selected: selectedPin,
            ),
          ),
        );
      }),
    ];

    final map = FlutterMap(
      mapController: mapController,
      options: MapOptions(
        initialCenter: LatLng(widget.userLat, widget.userLng),
        initialZoom: 12.4,
        onTap: (_, __) => setState(() => selectedId = null),
        interactionOptions: const InteractionOptions(
          flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
        ),
      ),
      children: [
        TileLayer(
          // Light, clean basemap that fits ZANA cream/copper brand.
          urlTemplate:
              'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          subdomains: const ['a', 'b', 'c', 'd'],
          userAgentPackageName: 'zm.zana.zana_customer',
          retinaMode: RetinaMode.isHighDensity(context),
        ),
        MarkerLayer(markers: markers),
        RichAttributionWidget(
          attributions: [
            TextSourceAttribution(
              'OpenStreetMap',
              onTap: () {},
            ),
            const TextSourceAttribution('CARTO'),
          ],
        ),
      ],
    );

    final body = Stack(
      children: [
        Positioned.fill(child: map),
        // Soft top brand wash
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: IgnorePointer(
            child: Container(
              height: 140,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    ZanaColors.cream.withValues(alpha: 0.96),
                    ZanaColors.cream.withValues(alpha: 0.55),
                    ZanaColors.cream.withValues(alpha: 0),
                  ],
                ),
              ),
            ),
          ),
        ),
        SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Expanded(
                      child: ZanaWordmark(
                        markSize: 34,
                        compact: true,
                        showSlogan: false,
                      ),
                    ),
                    _RoundMapButton(
                      icon: Icons.my_location_rounded,
                      tooltip: 'Recenter',
                      onTap: _recenter,
                    ),
                    const SizedBox(width: 8),
                    _RoundMapButton(
                      icon: Icons.refresh_rounded,
                      tooltip: 'Refresh',
                      onTap: () async {
                        fitted = false;
                        await widget.onRefresh?.call();
                        if (mounted) _fitToContent();
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  '${items.length} pros nearby',
                  style: const TextStyle(
                    color: ZanaColors.muted,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  height: 38,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      for (final entry in const [
                        ('ALL', 'Nearby', Icons.near_me_rounded),
                        ('BARBER', 'Barber', Icons.content_cut_rounded),
                        ('SALON', 'Salon', Icons.spa_rounded),
                        ('MOBILE', 'Mobile', Icons.directions_walk_rounded),
                      ])
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: _MapChip(
                            label: entry.$2,
                            icon: entry.$3,
                            selected: category == entry.$1,
                            onTap: () {
                              setState(() {
                                category = entry.$1;
                                selectedId = null;
                                fitted = false;
                              });
                              WidgetsBinding.instance.addPostFrameCallback(
                                (_) => _fitToContent(),
                              );
                            },
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        if (selected != null)
          Positioned(
            left: 16,
            right: 16,
            bottom: 18,
            child: _SelectedProCard(
              provider: selected,
              onClose: () => setState(() => selectedId = null),
              onOpen: () => _openProvider(selected['id'] as String),
            ),
          )
        else
          Positioned(
            left: 16,
            right: 16,
            bottom: 18,
            child: IgnorePointer(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: ZanaColors.paper.withValues(alpha: 0.94),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: ZanaColors.ink.withValues(alpha: 0.06),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: ZanaColors.ink.withValues(alpha: 0.08),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: const Text(
                  'Tap a pin to preview a salon or barber',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: ZanaColors.muted,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          ),
      ],
    );

    if (widget.embedded) {
      return ColoredBox(color: ZanaColors.cream, child: body);
    }

    return Scaffold(
      body: body,
    );
  }
}

class _YouPin extends StatelessWidget {
  const _YouPin();

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: ZanaColors.copper.withValues(alpha: 0.16),
          ),
        ),
        Container(
          width: 18,
          height: 18,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: ZanaColors.ink,
            border: Border.all(color: Colors.white, width: 3),
            boxShadow: [
              BoxShadow(
                color: ZanaColors.ink.withValues(alpha: 0.25),
                blurRadius: 8,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ProPin extends StatelessWidget {
  const _ProPin({
    required this.label,
    required this.online,
    required this.selected,
  });

  final String label;
  final bool online;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final fill = selected ? ZanaColors.ink : ZanaColors.copper;
    return AnimatedScale(
      scale: selected ? 1.08 : 1,
      duration: const Duration(milliseconds: 160),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: selected ? 44 : 38,
            height: selected ? 44 : 38,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: fill,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2.5),
              boxShadow: [
                BoxShadow(
                  color: fill.withValues(alpha: 0.35),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Text(
              label,
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: selected ? 16 : 14,
              ),
            ),
          ),
          CustomPaint(
            size: const Size(14, 10),
            painter: _PinTipPainter(color: fill),
          ),
          if (online)
            Container(
              width: 8,
              height: 8,
              margin: const EdgeInsets.only(top: 2),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 1.5),
              ),
            ),
        ],
      ),
    );
  }
}

class _PinTipPainter extends CustomPainter {
  _PinTipPainter({required this.color});

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
  bool shouldRepaint(covariant _PinTipPainter oldDelegate) =>
      oldDelegate.color != color;
}

class _RoundMapButton extends StatelessWidget {
  const _RoundMapButton({
    required this.icon,
    required this.onTap,
    required this.tooltip,
  });

  final IconData icon;
  final VoidCallback onTap;
  final String tooltip;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: ZanaColors.paper,
      shape: const CircleBorder(),
      elevation: 0,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Tooltip(
          message: tooltip,
          child: Container(
            width: 42,
            height: 42,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: ZanaColors.ink.withValues(alpha: 0.06)),
              boxShadow: [
                BoxShadow(
                  color: ZanaColors.ink.withValues(alpha: 0.06),
                  blurRadius: 10,
                ),
              ],
            ),
            child: Icon(icon, size: 20, color: ZanaColors.ink),
          ),
        ),
      ),
    );
  }
}

class _MapChip extends StatelessWidget {
  const _MapChip({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? ZanaColors.ink : ZanaColors.paper,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: selected
                ? null
                : Border.all(color: ZanaColors.ink.withValues(alpha: 0.08)),
            boxShadow: [
              BoxShadow(
                color: ZanaColors.ink.withValues(alpha: 0.05),
                blurRadius: 10,
              ),
            ],
          ),
          child: Row(
            children: [
              Icon(
                icon,
                size: 15,
                color: selected ? Colors.white : ZanaColors.ink,
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: selected ? Colors.white : ZanaColors.ink,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SelectedProCard extends StatelessWidget {
  const _SelectedProCard({
    required this.provider,
    required this.onClose,
    required this.onOpen,
  });

  final Map<String, dynamic> provider;
  final VoidCallback onClose;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final name = provider['displayName'] as String? ?? 'Pro';
    final cover = provider['coverPhotoUrl'] as String?;
    final online = provider['isOnline'] == true;
    final rating = (provider['ratingAvg'] as num?)?.toDouble() ?? 0;
    final count = provider['ratingCount'] as int? ?? 0;
    final km = (provider['distanceKm'] as num?)?.toDouble();

    return Material(
      color: ZanaColors.paper,
      borderRadius: BorderRadius.circular(20),
      clipBehavior: Clip.antiAlias,
      elevation: 0,
      child: InkWell(
        onTap: onOpen,
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: ZanaColors.ink.withValues(alpha: 0.06)),
            boxShadow: [
              BoxShadow(
                color: ZanaColors.ink.withValues(alpha: 0.12),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: SizedBox(
                    width: 72,
                    height: 72,
                    child: cover != null
                        ? Image.network(
                            cover,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => _MapInitial(name: name),
                          )
                        : _MapInitial(name: name),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 16,
                              ),
                            ),
                          ),
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            onPressed: onClose,
                            icon: const Icon(Icons.close_rounded, size: 18),
                          ),
                        ],
                      ),
                      Text(
                        '${provider['area']} · ${provider['type']}'
                        '${km != null ? ' · ${km.toStringAsFixed(1)} km' : ''}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: ZanaColors.muted,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: online
                                  ? const Color(0xFFECFDF5)
                                  : ZanaColors.sand,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              online ? 'Online' : 'Offline',
                              style: TextStyle(
                                color: online
                                    ? const Color(0xFF047857)
                                    : ZanaColors.muted,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            count > 0
                                ? '${rating.toStringAsFixed(1)}★'
                                : 'New',
                            style: TextStyle(
                              color: count > 0
                                  ? ZanaColors.copper
                                  : ZanaColors.muted,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                          const Spacer(),
                          const Text(
                            'View',
                            style: TextStyle(
                              color: ZanaColors.copper,
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MapInitial extends StatelessWidget {
  const _MapInitial({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: ZanaColors.sand,
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : 'Z',
          style: const TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 24,
            color: ZanaColors.copper,
          ),
        ),
      ),
    );
  }
}
