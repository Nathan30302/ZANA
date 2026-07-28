import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
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

/// Rough ETA from distance (city traffic ~22 km/h).
String etaLabelFromKm(double? km) {
  if (km == null) return 'ETA —';
  if (km < 0.08) return 'Arriving';
  final minutes = (km / 22 * 60).clamp(1, 90).round();
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
