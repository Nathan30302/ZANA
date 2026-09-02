import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/provider_screen.dart';
import 'package:zana_customer/theme.dart';
import 'package:zana_customer/widgets/zana_ui.dart';

const categories = [
  ('ALL', 'Nearby', Icons.near_me_outlined),
  ('BARBER', 'Barber', Icons.content_cut_rounded),
  ('SALON', 'Salon', Icons.brush_rounded),
  ('MOBILE', 'Mobile', Icons.directions_car_filled_outlined),
];

class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    this.userLat = ZanaApi.lusakaLat,
    this.userLng = ZanaApi.lusakaLng,
    this.onProvidersLoaded,
    this.onLocationResolved,
  });

  final double userLat;
  final double userLng;
  final ValueChanged<List<dynamic>>? onProvidersLoaded;
  final void Function(double lat, double lng)? onLocationResolved;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String category = 'ALL';
  String? area;
  String query = '';
  late Future<List<dynamic>> future;
  List<String> areas = [];
  late double userLat;
  late double userLng;
  final searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    userLat = widget.userLat;
    userLng = widget.userLng;
    future = _bootstrap();
  }

  @override
  void dispose() {
    searchCtrl.dispose();
    super.dispose();
  }

  Future<List<dynamic>> _bootstrap() async {
    await _resolveLocation();
    try {
      areas = await api.listAreas();
    } catch (_) {
      areas = const [
        'Roma',
        'Kabulonga',
        'CBD',
        'Woodlands',
        'Rhodes Park',
        'Olympia',
        'Chilanga',
        'Chelstone',
        'Matero',
        'Chilenje',
      ];
    }
    return _load();
  }

  Future<void> _resolveLocation() async {
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
      userLat = pos.latitude;
      userLng = pos.longitude;
      widget.onLocationResolved?.call(userLat, userLng);
    } catch (_) {}
  }

  Future<List<dynamic>> _load() async {
    final items = await api.listProviders(
      category: category == 'ALL' ? null : category,
      area: area,
      q: query.isEmpty ? null : query,
      lat: userLat,
      lng: userLng,
    );
    widget.onProvidersLoaded?.call(items);
    return items;
  }

  void _reload() {
    setState(() => future = _load());
  }

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(gradient: ZanaColors.surfaceGradient),
      child: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _HeroHeader(
              onSignOut: api.token != null
                  ? () async {
                      await api.logout();
                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: const Text('Signed out'),
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      );
                      setState(() {});
                    }
                  : null,
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
              child: TextField(
                controller: searchCtrl,
                decoration: ZanaDecorations.inputDecoration(
                  hint: 'Search salons, barbers, stylists…',
                  prefixIcon: Icons.search_rounded,
                  suffix: query.isEmpty
                      ? null
                      : IconButton(
                          icon: const Icon(Icons.close_rounded, size: 18),
                          onPressed: () {
                            searchCtrl.clear();
                            query = '';
                            _reload();
                          },
                        ),
                ),
                onChanged: (v) => query = v.trim(),
                onSubmitted: (v) {
                  query = v.trim();
                  _reload();
                },
                textInputAction: TextInputAction.search,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 42,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                scrollDirection: Axis.horizontal,
                children: [
                  ZanaChip(
                    label: 'All areas',
                    selected: area == null,
                    onTap: () {
                      area = null;
                      _reload();
                    },
                  ),
                  ...areas.map(
                    (a) => Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: ZanaChip(
                        label: a,
                        selected: area == a,
                        onTap: () {
                          area = a;
                          _reload();
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 44,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                scrollDirection: Axis.horizontal,
                itemCount: categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  final (code, label, icon) = categories[i];
                  return ZanaChip(
                    label: label,
                    icon: icon,
                    selected: code == category,
                    emphasis: true,
                    onTap: () {
                      category = code;
                      _reload();
                    },
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
              child: Row(
                children: [
                  Text('Curated for you', style: ZanaText.sectionTitle(context)),
                  const Spacer(),
                  Text(
                    'Lusaka',
                    style: ZanaText.subtitle(context).copyWith(
                      fontWeight: FontWeight.w600,
                      color: ZanaColors.copper,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: FutureBuilder<List<dynamic>>(
                future: future,
                builder: (context, snap) {
                  if (snap.connectionState == ConnectionState.waiting) {
                    return const ZanaShimmerList();
                  }
                  if (snap.hasError) {
                    return ZanaEmptyState(
                      icon: Icons.wifi_off_rounded,
                      title: 'Connection issue',
                      subtitle:
                          'Could not reach ZANA.\nCheck your connection and try again.',
                      actionLabel: 'Retry',
                      onAction: _reload,
                    );
                  }
                  final items = snap.data ?? [];
                  if (items.isEmpty) {
                    return ZanaEmptyState(
                      icon: Icons.search_off_rounded,
                      title: 'No matches',
                      subtitle:
                          'No pros match these filters.\nTry another area or category.',
                      actionLabel: 'Clear filters',
                      onAction: () {
                        area = null;
                        category = 'ALL';
                        query = '';
                        searchCtrl.clear();
                        _reload();
                      },
                    );
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 100),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 16),
                    itemBuilder: (context, i) {
                      final p = items[i] as Map<String, dynamic>;
                      return ZanaProviderCard(
                        provider: p,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => ProviderScreen(
                                providerId: p['id'] as String,
                              ),
                            ),
                          );
                        },
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroHeader extends StatelessWidget {
  const _HeroHeader({this.onSignOut});

  final VoidCallback? onSignOut;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 8, 12, 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: ZanaColors.heroGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: ZanaColors.espresso.withValues(alpha: 0.25),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'ZANA',
                  style: ZanaText.display(context).copyWith(
                    fontSize: 36,
                    color: ZanaColors.gold,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Premium beauty & grooming\nacross Lusaka',
                  style: ZanaText.subtitle(context).copyWith(
                    color: Colors.white.withValues(alpha: 0.82),
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 7,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.15),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.location_on_rounded,
                        size: 14,
                        color: ZanaColors.gold.withValues(alpha: 0.9),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Verified pros · Instant booking',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.9),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (onSignOut != null)
            IconButton(
              tooltip: 'Sign out',
              onPressed: onSignOut,
              icon: Icon(
                Icons.logout_rounded,
                size: 20,
                color: Colors.white.withValues(alpha: 0.7),
              ),
            ),
        ],
      ),
    );
  }
}
