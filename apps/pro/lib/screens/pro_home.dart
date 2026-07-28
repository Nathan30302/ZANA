import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:zana_pro/api.dart';
import 'package:zana_pro/screens/auth_sheet.dart';
import 'package:zana_pro/screens/buy_float_sheet.dart';
import 'package:zana_pro/screens/onboarding_screen.dart';
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
  Map<String, dynamic>? profile;
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
      if (api.token == null) {
        final ok = await showProAuthSheet(context);
        if (!ok) {
          setState(() {
            error = 'Sign in required';
            loading = false;
          });
          return;
        }
      }
      try {
        await api.registerFcmToken(
          'pro-dev-fcm-${DateTime.now().millisecondsSinceEpoch}',
        );
      } catch (_) {}

      Map<String, dynamic> me;
      try {
        me = await api.me();
      } catch (_) {
        await api.logout();
        if (!mounted) return;
        setState(() {
          error = 'No provider profile yet. Apply at zana.zm/apply first.';
          loading = false;
        });
        return;
      }

      final bal = await api.balance();
      final j = await api.jobs();
      final p = await api.packages();
      setState(() {
        profile = me;
        online = me['isOnline'] as bool? ?? false;
        credits = bal['creditBalance'] as int? ?? 0;
        jobs = j;
        packages = p;
        loading = false;
      });
      _syncLocationTracking(j);

      final services = (me['services'] as List?) ?? [];
      final active = services.where((s) => (s as Map)['isActive'] != false);
      if (active.isEmpty || me['lat'] == null) {
        if (!mounted) return;
        await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => OnboardingScreen(
              profile: me,
              onDone: _bootstrap,
            ),
          ),
        );
      }
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
    } catch (_) {}
  }

  Future<void> _toggle(bool value) async {
    try {
      final next = await api.setOnline(value);
      setState(() => online = next['isOnline'] as bool? ?? value);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    }
  }

  Future<void> _openBuyFloat() async {
    await showBuyFloatSheet(
      context,
      packages: packages,
      onDone: _bootstrap,
    );
  }

  Future<void> _openSetup() async {
    final me = profile ?? await api.me();
    if (!mounted) return;
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => OnboardingScreen(profile: me, onDone: _bootstrap),
      ),
    );
  }

  Future<void> _accept(String id) async {
    await api.updateStatus(id, 'ACCEPTED');
    await _bootstrap();
  }

  Future<void> _decline(String id) async {
    await api.updateStatus(id, 'DECLINED');
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
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(error!, textAlign: TextAlign.center),
                          const SizedBox(height: 12),
                          FilledButton(
                            onPressed: () async {
                              await api.logout();
                              await _bootstrap();
                            },
                            child: const Text('Sign in'),
                          ),
                        ],
                      ),
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _bootstrap,
                    child: ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                'ZANA Pro',
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.w800,
                                      color: ZanaColors.copper,
                                    ),
                              ),
                            ),
                            IconButton(
                              tooltip: 'Shop setup',
                              onPressed: _openSetup,
                              icon: const Icon(Icons.storefront_outlined),
                            ),
                            IconButton(
                              tooltip: 'Sign out',
                              onPressed: () async {
                                await api.logout();
                                await _bootstrap();
                              },
                              icon: const Icon(Icons.logout),
                            ),
                          ],
                        ),
                        if (profile != null)
                          Text(
                            profile!['displayName'] as String? ?? '',
                            style: const TextStyle(color: ZanaColors.muted),
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
                                    const Text('Go Online',
                                        style: TextStyle(fontWeight: FontWeight.w700)),
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
                                    const Text('Float credits',
                                        style: TextStyle(color: Colors.white70)),
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
                                  style: TextButton.styleFrom(
                                      foregroundColor: ZanaColors.copper),
                                  child: const Text('Buy float'),
                                ),
                            ],
                          ),
                        ),
                        if (_trackingBookingId != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            'Sharing live location for active job',
                            style: TextStyle(
                                color: Colors.green.shade700, fontSize: 13),
                          ),
                        ],
                        const SizedBox(height: 20),
                        const Text('Incoming jobs',
                            style: TextStyle(
                                fontWeight: FontWeight.w700, fontSize: 18)),
                        const SizedBox(height: 8),
                        if (jobs.isEmpty)
                          const Text('No jobs yet.',
                              style: TextStyle(color: ZanaColors.muted)),
                        ...jobs.map((raw) {
                          final job = raw as Map<String, dynamic>;
                          final service = job['service'] as Map<String, dynamic>?;
                          final status = job['status'] as String;
                          final address = job['customerAddress'] as String?;
                          Widget? action;
                          if (status == 'REQUESTED') {
                            action = Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                TextButton(
                                  onPressed: () => _decline(job['id'] as String),
                                  child: const Text('Decline'),
                                ),
                                TextButton(
                                  onPressed: () => _accept(job['id'] as String),
                                  child: const Text('Accept'),
                                ),
                              ],
                            );
                          } else if (status == 'ACCEPTED' ||
                              status == 'CONFIRMED') {
                            action = TextButton(
                              onPressed: () =>
                                  _advance(job['id'] as String, 'ON_THE_WAY'),
                              child: const Text('On the way'),
                            );
                          } else if (status == 'ON_THE_WAY') {
                            action = TextButton(
                              onPressed: () =>
                                  _advance(job['id'] as String, 'IN_SERVICE'),
                              child: const Text('Start'),
                            );
                          } else if (status == 'IN_SERVICE') {
                            action = TextButton(
                              onPressed: () =>
                                  _advance(job['id'] as String, 'COMPLETED'),
                              child: const Text('Complete'),
                            );
                          }
                          return Card(
                            color: ZanaColors.paper,
                            elevation: 0,
                            child: ListTile(
                              title: Text(service?['name'] as String? ?? 'Service'),
                              subtitle: Text(
                                'Status: $status · K${job['priceZmw']}'
                                '${address != null ? '\n$address' : ''}',
                              ),
                              isThreeLine: address != null,
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
