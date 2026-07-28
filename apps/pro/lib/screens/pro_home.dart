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
import 'package:zana_pro/widgets.dart';

class ProHomeScreen extends StatefulWidget {
  const ProHomeScreen({super.key});

  @override
  State<ProHomeScreen> createState() => _ProHomeScreenState();
}

class _ProHomeScreenState extends State<ProHomeScreen>
    with SingleTickerProviderStateMixin {
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
  int tabIndex = 0;
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);
    _bootstrap();
  }

  @override
  void dispose() {
    _locationTimer?.cancel();
    _pollTimer?.cancel();
    _pulse.dispose();
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
    final initial = profile == null && error == null;
    setState(() {
      if (initial) loading = true;
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
      if (!mounted) return;
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
        if (needsSetup && mounted) {
          setState(() => tabIndex = 3);
        }
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        error = e.toString();
        loading = false;
      });
    }
  }

  void _syncLocationTracking(List<dynamic> jobList) {
    final active = jobList.cast<Map<String, dynamic>>().where((j) {
      final s = j['status'] as String?;
      // Share GPS as soon as accepted so the customer sees the pro moving
      // (Yango-style), not only after tapping "On the way".
      return s == 'ACCEPTED' ||
          s == 'ON_THE_WAY' ||
          s == 'IN_SERVICE' ||
          s == 'CONFIRMED';
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
    _locationTimer = Timer.periodic(const Duration(seconds: 6), (_) {
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

  bool get _isOwner =>
      profile != null && profile!['roleOnShop'] != 'STAFF';

  int get _shopTabIndex => _isOwner ? 3 : -1;

  void _openSetup() {
    if (!_isOwner) return;
    setState(() => tabIndex = _shopTabIndex);
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
        backgroundColor: ZanaColors.paper,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Decline job'),
        content: TextField(
          controller: reasonCtrl,
          decoration: const InputDecoration(
            labelText: 'Reason (optional)',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Decline'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    await api.updateStatus(
      id,
      'DECLINED',
      declineReason: reasonCtrl.text.trim(),
    );
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

  List<Map<String, dynamic>> get _activeJobs {
    const activeStatuses = {
      'REQUESTED',
      'ACCEPTED',
      'CONFIRMED',
      'ON_THE_WAY',
      'IN_SERVICE',
    };
    return jobs
        .where((raw) => activeStatuses.contains((raw as Map)['status']))
        .cast<Map<String, dynamic>>()
        .toList();
  }

  Widget _jobsTab() {
    return RefreshIndicator(
      color: ZanaColors.copper,
      onRefresh: _bootstrap,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 24),
        children: [
          _Header(
            profile: profile,
            sharedFloat: sharedFloat,
            onSignOut: () async {
              await api.logout();
              if (!mounted) return;
              setState(() {
                profile = null;
                tabIndex = 0;
                _setupChecked = false;
              });
              await _bootstrap();
            },
          ),
          const SizedBox(height: 18),
          if (_isOwner &&
              readiness != null &&
              (readiness!['ready'] as bool? ?? false) == false) ...[
            _SetupBanner(
              blockers: ((readiness!['blockers'] as List?) ?? []).cast<String>(),
              onOpen: _openSetup,
            ),
            const SizedBox(height: 14),
          ],
          if (_isOwner) ...[
            _OnlinePanel(
              online: online,
              pulse: _pulse,
              onChanged: _toggle,
            ),
            const SizedBox(height: 12),
          ],
          _FloatStrip(
            credits: credits,
            canBuy: packages.isNotEmpty,
            onBuy: _openBuyFloat,
          ),
          if (_trackingBookingId != null) ...[
            const SizedBox(height: 12),
            _LiveShareHint(pulse: _pulse),
          ],
          const SizedBox(height: 26),
          Row(
            children: [
              Text(
                'Active jobs',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: ZanaColors.ink,
                    ),
              ),
              const Spacer(),
              if (_activeJobs.isNotEmpty)
                Text(
                  '${_activeJobs.length}',
                  style: const TextStyle(
                    color: ZanaColors.copper,
                    fontWeight: FontWeight.w800,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          if (_activeJobs.isEmpty)
            _EmptyJobs(online: online)
          else
            ..._activeJobs.map((job) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _JobTile(
                  job: job,
                  onOpen: () => _openJob(job['id'] as String),
                  onAccept: () => _accept(job['id'] as String),
                  onDecline: () => _decline(job['id'] as String),
                  onAdvance: (status) =>
                      _advance(job['id'] as String, status),
                ),
              );
            }),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final showChrome = !loading && error == null;
    final tabs = <Widget>[
      _jobsTab(),
      const ScheduleScreen(embedded: true),
      if (_isOwner) const StaffScreen(embedded: true),
      if (_isOwner && profile != null)
        OnboardingScreen(
          profile: profile!,
          onDone: _bootstrap,
          embedded: true,
        ),
    ];
    final safeIndex =
        tabIndex.clamp(0, tabs.isEmpty ? 0 : tabs.length - 1).toInt();

    return Scaffold(
      backgroundColor: ZanaColors.cream,
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFF3EDE4),
              ZanaColors.cream,
              ZanaColors.cream,
            ],
            stops: [0, 0.28, 1],
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: loading
              ? const Center(
                  child: CircularProgressIndicator(color: ZanaColors.copper),
                )
              : error != null
                  ? _ErrorState(
                      message: error!,
                      onSignIn: () async {
                        await api.logout();
                        await _bootstrap();
                      },
                    )
                  : IndexedStack(
                      index: safeIndex,
                      children: tabs,
                    ),
        ),
      ),
      bottomNavigationBar: showChrome
          ? Container(
              decoration: BoxDecoration(
                color: ZanaColors.paper.withValues(alpha: 0.96),
                border: Border(
                  top: BorderSide(
                    color: ZanaColors.ink.withValues(alpha: 0.06),
                  ),
                ),
                boxShadow: [
                  BoxShadow(
                    color: ZanaColors.ink.withValues(alpha: 0.05),
                    blurRadius: 20,
                    offset: const Offset(0, -6),
                  ),
                ],
              ),
              child: SafeArea(
                top: false,
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                  child: Row(
                    children: [
                      ProNavItem(
                        icon: Icons.work_outline_rounded,
                        activeIcon: Icons.work_rounded,
                        label: 'Jobs',
                        selected: safeIndex == 0,
                        onTap: () => setState(() => tabIndex = 0),
                      ),
                      ProNavItem(
                        icon: Icons.calendar_month_outlined,
                        activeIcon: Icons.calendar_month_rounded,
                        label: 'Schedule',
                        selected: safeIndex == 1,
                        onTap: () => setState(() => tabIndex = 1),
                      ),
                      if (_isOwner)
                        ProNavItem(
                          icon: Icons.groups_outlined,
                          activeIcon: Icons.groups_rounded,
                          label: 'Team',
                          selected: safeIndex == 2,
                          onTap: () => setState(() => tabIndex = 2),
                        ),
                      if (_isOwner)
                        ProNavItem(
                          icon: Icons.storefront_outlined,
                          activeIcon: Icons.storefront_rounded,
                          label: 'Shop',
                          selected: safeIndex == 3,
                          onTap: () => setState(() => tabIndex = 3),
                        ),
                    ],
                  ),
                ),
              ),
            )
          : null,
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.profile,
    required this.sharedFloat,
    required this.onSignOut,
  });

  final Map<String, dynamic>? profile;
  final bool sharedFloat;
  final VoidCallback onSignOut;

  @override
  Widget build(BuildContext context) {
    final name = profile?['displayName'] as String? ?? '';
    final isStaff = profile?['roleOnShop'] == 'STAFF';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Expanded(
              child: ZanaWordmark(markSize: 42, pro: true),
            ),
            _IconAction(
              icon: Icons.logout_rounded,
              tooltip: 'Sign out',
              onTap: onSignOut,
            ),
          ],
        ),
        if (name.isNotEmpty) ...[
          const SizedBox(height: 10),
          Text(
            [
              name,
              if (isStaff) 'Staff',
              if (sharedFloat) 'Shared float',
            ].join(' · '),
            style: const TextStyle(
              color: ZanaColors.muted,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ],
      ],
    );
  }
}

class _IconAction extends StatelessWidget {
  const _IconAction({
    required this.icon,
    required this.tooltip,
    required this.onTap,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: ZanaColors.paper,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: SizedBox(
            width: 40,
            height: 40,
            child: Icon(icon, size: 20, color: ZanaColors.ink),
          ),
        ),
      ),
    );
  }
}

class _SetupBanner extends StatelessWidget {
  const _SetupBanner({required this.blockers, required this.onOpen});

  final List<String> blockers;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFFFFF7ED),
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onOpen,
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 14, 14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: ZanaColors.copper.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.storefront_rounded,
                  color: ZanaColors.copper,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Finish setup to go online',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      blockers.take(3).join(' · '),
                      style: const TextStyle(
                        color: ZanaColors.muted,
                        fontSize: 12,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Open shop setup →',
                      style: TextStyle(
                        color: ZanaColors.copper,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnlinePanel extends StatelessWidget {
  const _OnlinePanel({
    required this.online,
    required this.pulse,
    required this.onChanged,
  });

  final bool online;
  final AnimationController pulse;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOutCubic,
      padding: const EdgeInsets.fromLTRB(16, 14, 12, 14),
      decoration: BoxDecoration(
        color: online ? const Color(0xFFECFDF5) : ZanaColors.paper,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: online
              ? const Color(0xFF059669).withValues(alpha: 0.25)
              : ZanaColors.ink.withValues(alpha: 0.06),
        ),
      ),
      child: Row(
        children: [
          AnimatedBuilder(
            animation: pulse,
            builder: (context, child) {
              return Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: online
                      ? Color.lerp(
                          const Color(0xFF059669),
                          const Color(0xFF34D399),
                          pulse.value,
                        )
                      : ZanaColors.muted,
                  boxShadow: online
                      ? [
                          BoxShadow(
                            color: const Color(0xFF059669)
                                .withValues(alpha: 0.35 * pulse.value),
                            blurRadius: 10,
                          ),
                        ]
                      : null,
                ),
              );
            },
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  online ? 'You’re online' : 'You’re offline',
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                Text(
                  online
                      ? 'Nearby customers can request you now'
                      : 'Go online to take nearby jobs',
                  style: const TextStyle(
                    color: ZanaColors.muted,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
            Switch.adaptive(
            value: online,
            activeThumbColor: const Color(0xFF059669),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}

class _FloatStrip extends StatelessWidget {
  const _FloatStrip({
    required this.credits,
    required this.canBuy,
    required this.onBuy,
  });

  final int credits;
  final bool canBuy;
  final VoidCallback onBuy;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 16, 14, 16),
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
                  style: TextStyle(
                    color: Colors.white70,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '$credits',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 36,
                    fontWeight: FontWeight.w800,
                    height: 1.05,
                  ),
                ),
                const Text(
                  '1 credit = 1 accepted job',
                  style: TextStyle(color: Colors.white54, fontSize: 11),
                ),
              ],
            ),
          ),
          if (canBuy)
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: ZanaColors.copper,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
              onPressed: onBuy,
              child: const Text('Buy float'),
            )
          else
            const Text(
              'No packages',
              style: TextStyle(color: Colors.white54, fontSize: 12),
            ),
        ],
      ),
    );
  }
}

class _LiveShareHint extends StatelessWidget {
  const _LiveShareHint({required this.pulse});

  final AnimationController pulse;

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: Tween(begin: 0.7, end: 1.0).animate(pulse),
      child: Row(
        children: [
          const Icon(Icons.near_me_rounded, size: 16, color: Color(0xFF047857)),
          const SizedBox(width: 8),
          Text(
            'Sharing live location with customer',
            style: TextStyle(
              color: Colors.green.shade800,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyJobs extends StatelessWidget {
  const _EmptyJobs({required this.online});

  final bool online;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 28),
      decoration: BoxDecoration(
        color: ZanaColors.paper.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: ZanaColors.ink.withValues(alpha: 0.05)),
      ),
      child: Column(
        children: [
          Icon(
            online ? Icons.hourglass_top_rounded : Icons.wifi_off_rounded,
            size: 36,
            color: ZanaColors.copper.withValues(alpha: 0.7),
          ),
          const SizedBox(height: 12),
          Text(
            online ? 'Waiting for requests' : 'You’re offline',
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            online
                ? 'Nearby customers will appear here when they book you.'
                : 'Flip online to start receiving nearby jobs.',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: ZanaColors.muted,
              fontSize: 13,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }
}

class _JobTile extends StatelessWidget {
  const _JobTile({
    required this.job,
    required this.onOpen,
    required this.onAccept,
    required this.onDecline,
    required this.onAdvance,
  });

  final Map<String, dynamic> job;
  final VoidCallback onOpen;
  final VoidCallback onAccept;
  final VoidCallback onDecline;
  final ValueChanged<String> onAdvance;

  String _label(String status) {
    switch (status) {
      case 'REQUESTED':
        return 'New request';
      case 'ACCEPTED':
        return 'Accepted';
      case 'CONFIRMED':
        return 'Customer ready';
      case 'ON_THE_WAY':
        return 'On the way';
      case 'IN_SERVICE':
        return 'In service';
      default:
        return status.replaceAll('_', ' ');
    }
  }

  Color _badgeColor(String status) {
    switch (status) {
      case 'REQUESTED':
        return ZanaColors.copper;
      case 'ON_THE_WAY':
      case 'IN_SERVICE':
        return const Color(0xFF047857);
      default:
        return ZanaColors.ink;
    }
  }

  @override
  Widget build(BuildContext context) {
    final service = job['service'] as Map<String, dynamic>?;
    final status = job['status'] as String;
    final mode = service?['mode'] as String?;
    final address = job['customerAddress'] as String?;
    final assigned = job['assignedStaff'] as Map<String, dynamic>?;
    final isNew = status == 'REQUESTED';

    String? primaryLabel;
    VoidCallback? primaryAction;
    if (status == 'REQUESTED') {
      primaryLabel = 'Accept';
      primaryAction = onAccept;
    } else if (status == 'ACCEPTED') {
      primaryLabel = mode == 'AT_SHOP' ? 'Arrived' : 'On the way';
      primaryAction = () =>
          onAdvance(mode == 'AT_SHOP' ? 'CONFIRMED' : 'ON_THE_WAY');
    } else if (status == 'CONFIRMED' || status == 'ON_THE_WAY') {
      primaryLabel = 'Start service';
      primaryAction = () => onAdvance('IN_SERVICE');
    } else if (status == 'IN_SERVICE') {
      primaryLabel = 'Complete';
      primaryAction = () => onAdvance('COMPLETED');
    }

    return Material(
      color: ZanaColors.paper,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onOpen,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isNew
                  ? ZanaColors.copper.withValues(alpha: 0.35)
                  : ZanaColors.ink.withValues(alpha: 0.06),
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: _badgeColor(status).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _label(status),
                        style: TextStyle(
                          color: _badgeColor(status),
                          fontWeight: FontWeight.w800,
                          fontSize: 11,
                        ),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      'K${job['priceZmw']}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        color: ZanaColors.copper,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  service?['name'] as String? ?? 'Service',
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 17,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  [
                    mode == 'COMES_TO_YOU' ? 'Comes to you' : 'At shop',
                    if (assigned != null)
                      'Staff: ${assigned['name'] ?? assigned['phone']}',
                  ].join(' · '),
                  style: const TextStyle(
                    color: ZanaColors.muted,
                    fontSize: 13,
                  ),
                ),
                if (address != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    address,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: ZanaColors.muted,
                      fontSize: 12,
                    ),
                  ),
                ],
                if (primaryAction != null) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      if (isNew) ...[
                        Expanded(
                          child: OutlinedButton(
                            onPressed: onDecline,
                            child: const Text('Decline'),
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Expanded(
                        flex: isNew ? 1 : 1,
                        child: FilledButton(
                          style: FilledButton.styleFrom(
                            backgroundColor: isNew
                                ? ZanaColors.copper
                                : ZanaColors.charcoal,
                          ),
                          onPressed: primaryAction,
                          child: Text(primaryLabel!),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onSignIn});

  final String message;
  final VoidCallback onSignIn;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const ZanaWordmark(markSize: 48, pro: true, showSlogan: true),
            const SizedBox(height: 24),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: ZanaColors.muted, height: 1.4),
            ),
            const SizedBox(height: 18),
            FilledButton(
              onPressed: onSignIn,
              child: const Text('Sign in'),
            ),
          ],
        ),
      ),
    );
  }
}
