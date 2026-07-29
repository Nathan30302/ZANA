import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';

enum ZanaMapMode { street, satellite, hybrid }

List<Widget> zanaMapTileLayers(BuildContext context, ZanaMapMode mode) {
  switch (mode) {
    case ZanaMapMode.street:
      return [
        TileLayer(
          urlTemplate:
              'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          subdomains: const ['a', 'b', 'c', 'd'],
          userAgentPackageName: 'zm.zana.zana_pro',
          retinaMode: RetinaMode.isHighDensity(context),
        ),
      ];
    case ZanaMapMode.satellite:
      return [
        TileLayer(
          urlTemplate:
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          userAgentPackageName: 'zm.zana.zana_pro',
          maxZoom: 19,
        ),
      ];
    case ZanaMapMode.hybrid:
      return [
        TileLayer(
          urlTemplate:
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          userAgentPackageName: 'zm.zana.zana_pro',
          maxZoom: 19,
        ),
        TileLayer(
          urlTemplate:
              'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
          subdomains: const ['a', 'b', 'c', 'd'],
          userAgentPackageName: 'zm.zana.zana_pro',
          retinaMode: RetinaMode.isHighDensity(context),
        ),
      ];
  }
}
