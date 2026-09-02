import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/provider_screen.dart';
import 'package:zana_customer/theme.dart';
import 'package:zana_customer/widgets/zana_ui.dart';

class NearbyMapScreen extends StatefulWidget {
  const NearbyMapScreen({
    super.key,
    required this.providers,
    this.userLat = ZanaApi.lusakaLat,
    this.userLng = ZanaApi.lusakaLng,
    this.embedded = false,
  });

  final List<dynamic> providers;
  final double userLat;
  final double userLng;
  final bool embedded;

  @override
  State<NearbyMapScreen> createState() => _NearbyMapScreenState();
}

class _NearbyMapScreenState extends State<NearbyMapScreen> {
  final mapController = MapController();

  @override
  Widget build(BuildContext context) {
    final markers = <Marker>[
      Marker(
        point: LatLng(widget.userLat, widget.userLng),
        width: 40,
        height: 40,
        child: const Icon(
          Icons.person_pin_circle,
          color: ZanaColors.charcoal,
          size: 36,
        ),
      ),
    ];
    for (final raw in widget.providers) {
      final p = raw as Map<String, dynamic>;
      final lat = (p['lat'] as num?)?.toDouble();
      final lng = (p['lng'] as num?)?.toDouble();
      if (lat == null || lng == null) continue;
      markers.add(
        Marker(
          point: LatLng(lat, lng),
          width: 44,
          height: 44,
          child: GestureDetector(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) =>
                      ProviderScreen(providerId: p['id'] as String),
                ),
              );
            },
            child: const Icon(
              Icons.location_on_rounded,
              color: ZanaColors.copper,
              size: 40,
            ),
          ),
        ),
      );
    }

    final map = FlutterMap(
      mapController: mapController,
      options: MapOptions(
        initialCenter: LatLng(widget.userLat, widget.userLng),
        initialZoom: 12.2,
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'zm.zana.zana_customer',
        ),
        MarkerLayer(markers: markers),
      ],
    );

    if (widget.embedded) {
      return DecoratedBox(
        decoration: const BoxDecoration(gradient: ZanaColors.surfaceGradient),
        child: SafeArea(
          bottom: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const ZanaScreenHeader(
                overline: 'EXPLORE LUSAKA',
                title: 'Map',
                subtitle: 'Tap a pin to view and book a pro',
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(22),
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        boxShadow: [ZanaDecorations.cardShadow],
                      ),
                      child: map,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Nearby on map')),
      body: map,
    );
  }
}
