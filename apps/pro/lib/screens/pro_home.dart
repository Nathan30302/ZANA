import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:zana_pro/api.dart';
import 'package:zana_pro/screens/auth_sheet.dart';
import 'package:zana_pro/screens/buy_float_sheet.dart';
import 'package:zana_pro/screens/job_detail_screen.dart';
import 'package:zana_pro/screens/onboarding_screen.dart';
import 'package:zana_pro/screens/schedule_screen.dart';
import 'package:zana_pro/screens/staff_screen.dart';
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
  Map<String, dynamic>? readiness;
  bool sharedFloat = false;
  String? error;
  Timer? _locationTimer;
  Timer? _pollTimer;
  String? _trackingBookingId;
  bool _setupChecked = false;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _locationTimer?.cancel();
    _pollTimer?.cancel();
    super.dispose();
  }

  void _startJobPolling() {
    _pollTimer?.cancel();
    if (api.token == null) return;
    _pollTimer = Timer.periodic(const Duration(seconds: 8), (_) {
      _refreshJobs(silent: true);
    });
  }

  Future<void> _refreshJobs({required bool silent}) async {
    if (api.token == null) return;
    try {
      final bal = await api.balance();
      final j = await api.jobs();
      if (!mounted) return;
      setState(() {
        credits = bal['creditBalance'] as int? ?? 0;
        sharedFloat = bal['shared'] == true;
        jobs = j;
        if (!silent) loading = false;
        error = null;
      });
      _syncLocationTracking(j);
    } catch (e) {
      if (!mounted || silent) return;
      setState(() {
        error = e.toString();
        loading = false;
      });
    }
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
      Map<String, dynamic>? ready;
      final isOwner = me['roleOnShop'] != 'STAFF';
      if (isOwner) {
        try {
          ready = await api.readiness();
        } catch (_) {}
      }
      setState(() {
        profile = me;
        readiness = ready;
        online = me['isOnline'] as bool? ?? false;
        credits = bal['creditBalance'] as int? ?? 0;
        sharedFloat = bal['shared'] == true;
        jobs = j;
        packages = p;
        loading = false;
      });
      _syncLocationTracking(j);
      _startJobPolling();

      if (isOwner && !_setupChecked) {
        _setupChecked = true;
        final blockers = (ready?['blockers'] as List?) ?? [];
        final needsSetup = blockers.any((b) =>
            b == 'Shop pin on map' ||
            b == 'At least one service' ||
            b == 'Opening hours' ||
            b == 'Bio');
        if (needsSetup) {
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
    final reasonCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Decline job'),
        content: TextField(
          controller: reasonCtrl,
          decoration: const InputDecoration(
            labelText: 'Reason (optional)',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Decline')),
        ],
      ),
    );
    if (ok != true) return;
    await api.updateStatus(id, 'DECLINED', declineReason: reasonCtrl.text.trim());
    await _bootstrap();
  }

  Future<void> _openJob(String id) async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => JobDetailScreen(bookingId: id)),
    );
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
                      padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Expanded(
                              child: ZanaWordmark(
                                markSize: 42,
                                pro: true,
                              ),
                            ),
                            IconButton(
                              tooltip: 'Schedule',
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => const ScheduleScreen(),
                                  ),
                                );
                              },
                              icon: const Icon(Icons.calendar_today_outlined),
                            ),
                            if (profile?['roleOnShop'] != 'STAFF')
                              IconButton(
                                tooltip: 'Team',
                                onPressed: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => const StaffScreen(),
                                    ),
                                  );
                                },
                                icon: const Icon(Icons.groups_outlined),
                              ),
                            if (profile?['roleOnShop'] != 'STAFF')
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
                        if (profile != null) ...[
                          const SizedBox(height: 6),
                          Text(
                            '${profile!['displayName'] ?? ''}'
                            '${profile!['roleOnShop'] == 'STAFF' ? ' · Staff' : ''}'
                            '${sharedFloat ? ' · shared float' : ''}',
                            style: const TextStyle(color: ZanaColors.muted),
                          ),
                        ],
                        const SizedBox(height: 18),
                        if (profile?['roleOnShop'] != 'STAFF') ...[
                          if (readiness != null &&
                              (readiness!['ready'] as bool? ?? false) == false) ...[
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: ZanaColors.paper,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: ZanaColors.copper.withValues(alpha: 0.35),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Finish setup to go online',
                                    style: TextStyle(fontWeight: FontWeight.w700),
                                  ),
                                  const SizedBox(height: 6),
                                  ...((readiness!['blockers'] as List?) ?? []).map(
                                    (b) => Text(
                                      '• $b',
                                      style: const TextStyle(
                                        color: ZanaColors.muted,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                  TextButton(
                                    onPressed: _openSetup,
                                    child: const Text('Open shop setup'),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 12),
                          ],
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: ZanaColors.paper,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: ZanaColors.ink.withValues(alpha: 0.05),
                              ),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Go Online',
                                        style: TextStyle(fontWeight: FontWeight.w700),
                                      ),
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
                        ],
                        Container(
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                ZanaColors.ink,
                                ZanaColors.charcoal,
                                Color(0xFF3F2A1C),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Float credits',
                                      style: TextStyle(color: Colors.white70),
                                    ),
                                    Text(
                                      '$credits',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 34,
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
                                    foregroundColor: ZanaColors.copperSoft,
                                  ),
                                  child: const Text('Buy float'),
                                )
                              else
                                const Text(
                                  'No packages',
                                  style: TextStyle(
                                    color: Colors.white54,
                                    fontSize: 12,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        if (_trackingBookingId != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            'Sharing live location for active job',
                            style: TextStyle(
                              color: Colors.green.shade700,
                              fontSize: 13,
                            ),
                          ),
                        ],
                        const SizedBox(height: 22),
                        const Text(
                          'Active jobs',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 18,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Builder(builder: (context) {
                          const activeStatuses = {
                            'REQUESTED',
                            'ACCEPTED',
                            'CONFIRMED',
                            'ON_THE_WAY',
                            'IN_SERVICE',
                          };
                          final activeJobs = jobs.where((raw) {
                            final s = (raw as Map)['status'] as String?;
                            return activeStatuses.contains(s);
                          }).toList();
                          if (activeJobs.isEmpty) {
                            return const Padding(
                              padding: EdgeInsets.symmetric(vertical: 24),
                              child: Text(
                                'No active jobs.\nGo online and wait for nearby requests.',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: ZanaColors.muted),
                              ),
                            );
                          }
                          return Column(
                            children: activeJobs.map((raw) {
                              final job = raw as Map<String, dynamic>;
                              final service =
                                  job['service'] as Map<String, dynamic>?;
                              final status = job['status'] as String;
                              final mode = service?['mode'] as String?;
                              final address = job['customerAddress'] as String?;
                              final assigned =
                                  job['assignedStaff'] as Map<String, dynamic>?;
                              Widget? action;
                              if (status == 'REQUESTED') {
                                action = Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    TextButton(
                                      onPressed: () =>
                                          _decline(job['id'] as String),
                                      child: const Text('Decline'),
                                    ),
                                    TextButton(
                                      onPressed: () =>
                                          _accept(job['id'] as String),
                                      child: const Text('Accept'),
                                    ),
                                  ],
                                );
                              } else if (status == 'ACCEPTED') {
                                action = TextButton(
                                  onPressed: () => _advance(
                                    job['id'] as String,
                                    mode == 'AT_SHOP'
                                        ? 'CONFIRMED'
                                        : 'ON_THE_WAY',
                                  ),
                                  child: Text(mode == 'AT_SHOP'
                                      ? 'Arrived'
                                      : 'On the way'),
                                );
                              } else if (status == 'CONFIRMED') {
                                action = TextButton(
                                  onPressed: () => _advance(
                                      job['id'] as String, 'IN_SERVICE'),
                                  child: const Text('Start'),
                                );
                              } else if (status == 'ON_THE_WAY') {
                                action = TextButton(
                                  onPressed: () => _advance(
                                      job['id'] as String, 'IN_SERVICE'),
                                  child: const Text('Start'),
                                );
                              } else if (status == 'IN_SERVICE') {
                                action = TextButton(
                                  onPressed: () => _advance(
                                      job['id'] as String, 'COMPLETED'),
                                  child: const Text('Complete'),
                                );
                              }
                              return Card(
                                color: ZanaColors.paper,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  side: BorderSide(
                                    color: ZanaColors.ink.withValues(alpha: 0.05),
                                  ),
                                ),
                                child: ListTile(
                                  onTap: () => _openJob(job['id'] as String),
                                  title: Text(
                                    service?['name'] as String? ?? 'Service',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  subtitle: Text(
                                    'Status: $status · K${job['priceZmw']}'
                                    '${assigned != null ? '\nStaff: ${assigned['name'] ?? assigned['phone']}' : ''}'
                                    '${address != null ? '\n$address' : ''}',
                                  ),
                                  isThreeLine:
                                      address != null || assigned != null,
                                  trailing: action,
                                ),
                              );
                            }).toList(),
                          );
                        }),
                      ],
                    ),
                  ),
      ),
    );
  }
}
