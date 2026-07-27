import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:zana_pro/api.dart';
import 'package:zana_pro/screens/buy_float_sheet.dart';
import 'package:zana_pro/theme.dart';

class ProHomeScreen extends StatefulWidget {
  const ProHomeScreen({super.key});

  @override
  State<ProHomeScreen> createState() => _ProHomeScreenState();
}

class _ProHomeScreenState extends State<ProHomeScreen> {
  bool loading = true;
  bool online = false;
  int credits = 0;
  List<dynamic> jobs = [];
  List<dynamic> packages = [];
  String? error;
  Timer? _locationTimer;
  String? _trackingBookingId;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _locationTimer?.cancel();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      await api.loginAsSeedProvider();
      // Device FCM token would come from firebase_messaging; stub for now
      await api.registerFcmToken('pro-dev-fcm-${DateTime.now().millisecondsSinceEpoch}');
      final bal = await api.balance();
      final j = await api.jobs();
      final p = await api.packages();
      setState(() {
        credits = bal['creditBalance'] as int? ?? 0;
        jobs = j;
        packages = p;
        loading = false;
      });
      _syncLocationTracking(j);
    } catch (e) {
      setState(() {
        error = e.toString();
        loading = false;
      });
    }
  }

  void _syncLocationTracking(List<dynamic> jobList) {
    final active = jobList.cast<Map<String, dynamic>>().where((j) {
      final s = j['status'] as String?;
      return s == 'ON_THE_WAY' || s == 'IN_SERVICE';
    }).toList();

    if (active.isEmpty) {
      _locationTimer?.cancel();
      _locationTimer = null;
      _trackingBookingId = null;
      return;
    }

    final id = active.first['id'] as String;
    if (_trackingBookingId == id && _locationTimer != null) return;
    _trackingBookingId = id;
    _locationTimer?.cancel();
    _pingLocation(id);
    _locationTimer = Timer.periodic(const Duration(seconds: 12), (_) {
      _pingLocation(id);
    });
  }

  Future<void> _pingLocation(String bookingId) async {
    try {
      final enabled = await Geolocator.isLocationServiceEnabled();
      if (!enabled) return;
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        return;
      }
      final pos = await Geolocator.getCurrentPosition();
      await api.updateLocation(bookingId, pos.latitude, pos.longitude);
    } catch (_) {
      // Best-effort location share
    }
  }

  Future<void> _toggle(bool value) async {
    final profile = await api.setOnline(value);
    setState(() => online = profile['isOnline'] as bool? ?? value);
  }

  Future<void> _openBuyFloat() async {
    await showBuyFloatSheet(
      context,
      packages: packages,
      onDone: _bootstrap,
    );
  }

  Future<void> _accept(String id) async {
    await api.updateStatus(id, 'ACCEPTED');
    await _bootstrap();
  }

  Future<void> _advance(String id, String status) async {
    await api.updateStatus(id, status);
    await _bootstrap();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: loading
            ? const Center(child: CircularProgressIndicator())
            : error != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        'API offline or seed missing.\n$error',
                        textAlign: TextAlign.center,
                      ),
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _bootstrap,
                    child: ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        Text(
                          'ZANA Pro',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: ZanaColors.copper,
                              ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: ZanaColors.paper,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Go Online', style: TextStyle(fontWeight: FontWeight.w700)),
                                    Text(
                                      online ? 'Accepting jobs' : 'Offline',
                                      style: const TextStyle(color: ZanaColors.muted),
                                    ),
                                  ],
                                ),
                              ),
                              Switch(value: online, onChanged: _toggle),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: ZanaColors.charcoal,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Float credits', style: TextStyle(color: Colors.white70)),
                                    Text(
                                      '$credits',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 32,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (packages.isNotEmpty)
                                TextButton(
                                  onPressed: _openBuyFloat,
                                  style: TextButton.styleFrom(foregroundColor: ZanaColors.copper),
                                  child: const Text('Buy float'),
                                ),
                            ],
                          ),
                        ),
                        if (_trackingBookingId != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            'Sharing live location for active job',
                            style: TextStyle(color: Colors.green.shade700, fontSize: 13),
                          ),
                        ],
                        const SizedBox(height: 20),
                        const Text('Incoming jobs', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
                        const SizedBox(height: 8),
                        if (jobs.isEmpty)
                          const Text('No jobs yet.', style: TextStyle(color: ZanaColors.muted)),
                        ...jobs.map((raw) {
                          final job = raw as Map<String, dynamic>;
                          final service = job['service'] as Map<String, dynamic>?;
                          final status = job['status'] as String;
                          Widget? action;
                          if (status == 'REQUESTED') {
                            action = TextButton(
                              onPressed: () => _accept(job['id'] as String),
                              child: const Text('Accept'),
                            );
                          } else if (status == 'ACCEPTED' || status == 'CONFIRMED') {
                            action = TextButton(
                              onPressed: () => _advance(job['id'] as String, 'ON_THE_WAY'),
                              child: const Text('On the way'),
                            );
                          } else if (status == 'ON_THE_WAY') {
                            action = TextButton(
                              onPressed: () => _advance(job['id'] as String, 'IN_SERVICE'),
                              child: const Text('Start'),
                            );
                          } else if (status == 'IN_SERVICE') {
                            action = TextButton(
                              onPressed: () => _advance(job['id'] as String, 'COMPLETED'),
                              child: const Text('Complete'),
                            );
                          }
                          return Card(
                            color: ZanaColors.paper,
                            elevation: 0,
                            child: ListTile(
                              title: Text(service?['name'] as String? ?? 'Service'),
                              subtitle: Text('Status: $status · K${job['priceZmw']}'),
                              trailing: action,
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
      ),
    );
  }
}
