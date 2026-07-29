import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import 'package:zana_customer/theme.dart';

/// Map imagery modes — satellite shows building rooftops like Google Maps.
enum ZanaMapMode { street, satellite, hybrid }

/// Tile layers suitable for `FlutterMap.children`.
List<Widget> zanaMapTileLayers(BuildContext context, ZanaMapMode mode) {
  switch (mode) {
    case ZanaMapMode.street:
      return [
        TileLayer(
          urlTemplate:
              'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          subdomains: const ['a', 'b', 'c', 'd'],
          userAgentPackageName: 'zm.zana.zana_customer',
          retinaMode: RetinaMode.isHighDensity(context),
        ),
      ];
    case ZanaMapMode.satellite:
      return [
        TileLayer(
          urlTemplate:
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          userAgentPackageName: 'zm.zana.zana_customer',
          maxZoom: 19,
        ),
      ];
    case ZanaMapMode.hybrid:
      return [
        TileLayer(
          urlTemplate:
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          userAgentPackageName: 'zm.zana.zana_customer',
          maxZoom: 19,
        ),
        TileLayer(
          urlTemplate:
              'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
          subdomains: const ['a', 'b', 'c', 'd'],
          userAgentPackageName: 'zm.zana.zana_customer',
          retinaMode: RetinaMode.isHighDensity(context),
        ),
      ];
  }
}

class ZanaMapAttribution extends StatelessWidget {
  const ZanaMapAttribution({super.key, required this.mode});

  final ZanaMapMode mode;

  @override
  Widget build(BuildContext context) {
    final sources = mode == ZanaMapMode.street
        ? const ['OpenStreetMap', 'CARTO']
        : const ['Esri', 'OpenStreetMap', 'CARTO'];
    return RichAttributionWidget(
      attributions: [
        for (final s in sources) TextSourceAttribution(s, onTap: () {}),
      ],
    );
  }
}

class ZanaMapModeToggle extends StatelessWidget {
  const ZanaMapModeToggle({
    super.key,
    required this.mode,
    required this.onChanged,
  });

  final ZanaMapMode mode;
  final ValueChanged<ZanaMapMode> onChanged;

  @override
  Widget build(BuildContext context) {
    final isSat =
        mode == ZanaMapMode.satellite || mode == ZanaMapMode.hybrid;
    return Material(
      color: ZanaColors.paper.withValues(alpha: 0.94),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: () => onChanged(isSat ? ZanaMapMode.street : ZanaMapMode.hybrid),
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isSat ? Icons.map_rounded : Icons.satellite_alt_rounded,
                size: 18,
                color: ZanaColors.ink,
              ),
              const SizedBox(width: 6),
              Text(
                isSat ? 'Street' : 'Satellite',
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                  color: ZanaColors.ink,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Rough ETA from crow-flies distance (city traffic ~22 km/h).
String etaLabelFromKm(double? km) {
  if (km == null) return 'ETA —';
  if (km < 0.08) return 'Arriving';
  final minutes = (km / 22 * 60).clamp(1, 90).round();
  if (minutes < 2) return '~1 min';
  return '~$minutes min';
}

/// ETA from road-routing duration in seconds.
String etaLabelFromSeconds(int? seconds) {
  if (seconds == null) return 'ETA —';
  if (seconds < 45) return 'Arriving';
  final minutes = (seconds / 60).ceil().clamp(1, 120);
  if (minutes < 2) return '~1 min';
  return '~$minutes min';
}

double? haversineKm(double lat1, double lng1, double lat2, double lng2) {
  const r = 6371.0;
  final dLat = _toRad(lat2 - lat1);
  final dLng = _toRad(lng2 - lng1);
  final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(_toRad(lat1)) *
          math.cos(_toRad(lat2)) *
          math.sin(dLng / 2) *
          math.sin(dLng / 2);
  return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
}

double _toRad(double d) => d * math.pi / 180;

/// Linear interpolate between two map points.
LatLng lerpLatLng(LatLng a, LatLng b, double t) {
  final clamped = t.clamp(0.0, 1.0);
  return LatLng(
    a.latitude + (b.latitude - a.latitude) * clamped,
    a.longitude + (b.longitude - a.longitude) * clamped,
  );
}

/// Bearing in degrees from [from] toward [to] (0 = north, clockwise).
double bearingDegrees(LatLng from, LatLng to) {
  final lat1 = _toRad(from.latitude);
  final lat2 = _toRad(to.latitude);
  final dLng = _toRad(to.longitude - from.longitude);
  final y = math.sin(dLng) * math.cos(lat2);
  final x = math.cos(lat1) * math.sin(lat2) -
      math.sin(lat1) * math.cos(lat2) * math.cos(dLng);
  final brng = math.atan2(y, x) * 180 / math.pi;
  return (brng + 360) % 360;
}

class DrivingRoute {
  const DrivingRoute({
    required this.points,
    required this.distanceMeters,
    required this.durationSeconds,
  });

  final List<LatLng> points;
  final double distanceMeters;
  final int durationSeconds;

  double get distanceKm => distanceMeters / 1000.0;
}

/// Free road routing via the public OSRM demo server (OpenStreetMap).
Future<DrivingRoute?> fetchDrivingRoute({
  required double fromLat,
  required double fromLng,
  required double toLat,
  required double toLng,
}) async {
  final uri = Uri.parse(
    'https://router.project-osrm.org/route/v1/driving/'
    '$fromLng,$fromLat;$toLng,$toLat'
    '?overview=full&geometries=geojson',
  );
  try {
    final res = await http.get(uri).timeout(const Duration(seconds: 8));
    if (res.statusCode != 200) return null;
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (data['code'] != 'Ok') return null;
    final routes = data['routes'] as List?;
    if (routes == null || routes.isEmpty) return null;
    final route = routes.first as Map<String, dynamic>;
    final geometry = route['geometry'] as Map<String, dynamic>?;
    final coords = geometry?['coordinates'] as List?;
    if (coords == null || coords.isEmpty) return null;
    final points = <LatLng>[];
    for (final c in coords) {
      if (c is! List || c.length < 2) continue;
      points.add(LatLng((c[1] as num).toDouble(), (c[0] as num).toDouble()));
    }
    if (points.length < 2) return null;
    return DrivingRoute(
      points: points,
      distanceMeters: (route['distance'] as num?)?.toDouble() ?? 0,
      durationSeconds: ((route['duration'] as num?)?.round() ?? 0),
    );
  } catch (_) {
    return null;
  }
}

/// Fit camera to two pins with padding.
void fitMapToPins(
  MapController controller,
  LatLng a,
  LatLng b, {
  double paddingFactor = 0.28,
}) {
  final south = math.min(a.latitude, b.latitude);
  final north = math.max(a.latitude, b.latitude);
  final west = math.min(a.longitude, b.longitude);
  final east = math.max(a.longitude, b.longitude);
  final latPad = math.max((north - south) * paddingFactor, 0.004);
  final lngPad = math.max((east - west) * paddingFactor, 0.004);
  final bounds = LatLngBounds(
    LatLng(south - latPad, west - lngPad),
    LatLng(north + latPad, east + lngPad),
  );
  controller.fitCamera(
    CameraFit.bounds(bounds: bounds, padding: const EdgeInsets.all(48)),
  );
}
