import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/theme.dart';

class TrackingScreen extends StatefulWidget {
  const TrackingScreen({super.key, required this.bookingId});

  final String bookingId;

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  Map<String, dynamic>? booking;
  Timer? timer;
  String? error;

  @override
  void initState() {
    super.initState();
    _load();
    timer = Timer.periodic(const Duration(seconds: 5), (_) => _load());
  }

  @override
  void dispose() {
    timer?.cancel();
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
    } catch (e) {
      if (!mounted) return;
      setState(() => error = e.toString());
    }
  }

  Future<void> _call() async {
    final phone = booking?['contactPhone'] as String?;
    if (phone == null) return;
    // Masked display number — stub dialer with tel: (real masking later)
    final uri = Uri(scheme: 'tel', path: phone.replaceAll('*', '0'));
    await launchUrl(uri);
  }

  Future<void> _chat() async {
    final phone = booking?['contactPhone'] as String?;
    if (phone == null) return;
    final cleaned = phone.replaceAll('*', '');
    final uri = Uri.parse('https://wa.me/${cleaned.replaceAll('+', '')}');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final b = booking;
    final status = b?['status'] as String? ?? '…';
    final provider = b?['provider'] as Map<String, dynamic>?;
    final service = b?['service'] as Map<String, dynamic>?;

    final customerLat = (b?['customerLat'] as num?)?.toDouble();
    final customerLng = (b?['customerLng'] as num?)?.toDouble();
    final providerLat = (b?['providerLat'] as num?)?.toDouble() ??
        (provider?['lat'] as num?)?.toDouble();
    final providerLng = (b?['providerLng'] as num?)?.toDouble() ??
        (provider?['lng'] as num?)?.toDouble();

    final center = LatLng(
      providerLat ?? customerLat ?? ZanaApi.lusakaLat,
      providerLng ?? customerLng ?? ZanaApi.lusakaLng,
    );

    final markers = <Marker>[];
    if (providerLat != null && providerLng != null) {
      markers.add(
        Marker(
          point: LatLng(providerLat, providerLng),
          width: 48,
          height: 48,
          child: const Icon(Icons.cut, color: ZanaColors.copper, size: 36),
        ),
      );
    }
    if (customerLat != null && customerLng != null) {
      markers.add(
        Marker(
          point: LatLng(customerLat, customerLng),
          width: 48,
          height: 48,
          child: const Icon(Icons.home, color: ZanaColors.charcoal, size: 36),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Live status')),
      body: Column(
        children: [
          Expanded(
            child: error != null && b == null
                ? Center(child: Text(error!))
                : FlutterMap(
                    options: MapOptions(initialCenter: center, initialZoom: 13),
                    children: [
                      TileLayer(
                        urlTemplate:
                            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                        userAgentPackageName: 'zm.zana.zana_customer',
                      ),
                      MarkerLayer(markers: markers),
                    ],
                  ),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            color: ZanaColors.paper,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  service?['name'] as String? ?? 'Booking',
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                  ),
                ),
                Text(
                  '${provider?['displayName'] ?? 'Pro'} · $status',
                  style: const TextStyle(color: ZanaColors.muted),
                ),
                if (b?['customerAddress'] != null)
                  Text(
                    b!['customerAddress'] as String,
                    style: const TextStyle(color: ZanaColors.muted, fontSize: 13),
                  ),
                if (b?['contactPhone'] != null)
                  Text(
                    'Call/chat: ${b!['contactPhone']}',
                    style: const TextStyle(fontSize: 13),
                  ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: b?['contactPhone'] != null ? _call : null,
                        icon: const Icon(Icons.call),
                        label: const Text('Call'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FilledButton.icon(
                        style: FilledButton.styleFrom(
                          backgroundColor: ZanaColors.charcoal,
                        ),
                        onPressed: b?['contactPhone'] != null ? _chat : null,
                        icon: const Icon(Icons.chat),
                        label: const Text('WhatsApp'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
