import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/provider_screen.dart';
import 'package:zana_customer/theme.dart';

const categories = ['ALL', 'BARBER', 'SALON', 'MOBILE'];

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
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Using Lusaka CBD — enable location for nearby pros'),
            ),
          );
        }
        return;
      }
      final pos = await Geolocator.getCurrentPosition();
      userLat = pos.latitude;
      userLng = pos.longitude;
      widget.onLocationResolved?.call(userLat, userLng);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Using Lusaka CBD — enable location for nearby pros'),
          ),
        );
      }
    }
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

  String _categoryLabel(String c) {
    switch (c) {
      case 'ALL':
        return 'Nearby';
      case 'BARBER':
        return 'Barber';
      case 'SALON':
        return 'Salon';
      case 'MOBILE':
        return 'Mobile';
      default:
        return c;
    }
  }

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 12, 0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'ZANA',
                          style: Theme.of(context)
                              .textTheme
                              .headlineMedium
                              ?.copyWith(
                                fontWeight: FontWeight.w800,
                                letterSpacing: 3,
                                color: ZanaColors.copper,
                                height: 1.05,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Beauty & cuts around Lusaka',
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: ZanaColors.muted,
                                  ),
                        ),
                      ],
                    ),
                  ),
                  if (api.token != null)
                    IconButton(
                      tooltip: 'Sign out',
                      onPressed: () async {
                        await api.logout();
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Signed out')),
                        );
                        setState(() {});
                      },
                      icon: const Icon(Icons.logout_rounded, size: 22),
                      color: ZanaColors.muted,
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
              child: TextField(
                controller: searchCtrl,
                decoration: InputDecoration(
                  hintText: 'Search salons, barbers, stylists',
                  hintStyle: const TextStyle(color: ZanaColors.muted),
                  filled: true,
                  fillColor: ZanaColors.paper,
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(
                      color: ZanaColors.ink.withValues(alpha: 0.04),
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: ZanaColors.copper),
                  ),
                  prefixIcon: const Icon(Icons.search_rounded),
                  suffixIcon: query.isEmpty
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
                onSubmitted: (v) {
                  query = v.trim();
                  _reload();
                },
                textInputAction: TextInputAction.search,
              ),
            ),
            const SizedBox(height: 14),
            SizedBox(
              height: 38,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                scrollDirection: Axis.horizontal,
                children: [
                  _FilterChip(
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
                      child: _FilterChip(
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
            const SizedBox(height: 10),
            SizedBox(
              height: 40,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                scrollDirection: Axis.horizontal,
                itemCount: categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  final c = categories[i];
                  return _FilterChip(
                    label: _categoryLabel(c),
                    selected: c == category,
                    emphasis: true,
                    onTap: () {
                      category = c;
                      _reload();
                    },
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
              child: Text(
                'Near you',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: ZanaColors.ink,
                    ),
              ),
            ),
            Expanded(
              child: FutureBuilder<List<dynamic>>(
                future: future,
                builder: (context, snap) {
                  if (snap.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (snap.hasError) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text(
                          'Could not reach ZANA.\nCheck your connection and try again.',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: ZanaColors.muted),
                        ),
                      ),
                    );
                  }
                  final items = snap.data ?? [];
                  if (items.isEmpty) {
                    return const Center(
                      child: Text(
                        'No pros match these filters.\nTry another area or category.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: ZanaColors.muted),
                      ),
                    );
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, i) {
                      final p = items[i] as Map<String, dynamic>;
                      return _ProviderCard(provider: p);
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

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.emphasis = false,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final bool emphasis;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected
          ? (emphasis ? ZanaColors.charcoal : ZanaColors.copper)
          : ZanaColors.paper,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: selected
                ? null
                : Border.all(color: ZanaColors.ink.withValues(alpha: 0.08)),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: selected ? Colors.white : ZanaColors.ink,
            ),
          ),
        ),
      ),
    );
  }
}

class _ProviderCard extends StatelessWidget {
  const _ProviderCard({required this.provider});

  final Map<String, dynamic> provider;

  @override
  Widget build(BuildContext context) {
    final km = (provider['distanceKm'] as num?)?.toDouble();
    final cover = provider['coverPhotoUrl'] as String?;
    final rating = (provider['ratingAvg'] as num?)?.toDouble() ?? 0;
    final count = provider['ratingCount'] as int? ?? 0;
    final online = provider['isOnline'] == true;
    final name = provider['displayName'] as String? ?? 'Pro';

    return Material(
      color: ZanaColors.paper,
      elevation: 0,
      borderRadius: BorderRadius.circular(18),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) =>
                  ProviderScreen(providerId: provider['id'] as String),
            ),
          );
        },
        child: Row(
          children: [
            SizedBox(
              width: 96,
              height: 104,
              child: cover != null
                  ? Image.network(
                      cover,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _Initial(name: name),
                    )
                  : _Initial(name: name),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 16,
                              color: ZanaColors.ink,
                            ),
                          ),
                        ),
                        Text(
                          count > 0 ? '${rating.toStringAsFixed(1)}★' : 'New',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                            color: count > 0
                                ? ZanaColors.copper
                                : ZanaColors.muted,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${provider['area']} · ${provider['type']}'
                      '${km != null ? ' · ${km.toStringAsFixed(1)} km' : ''}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: ZanaColors.muted,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: online
                            ? const Color(0xFFECFDF5)
                            : ZanaColors.cream,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        online ? 'Online now' : 'Offline',
                        style: TextStyle(
                          color: online
                              ? const Color(0xFF047857)
                              : ZanaColors.muted,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.only(right: 10),
              child: Icon(
                Icons.chevron_right_rounded,
                color: ZanaColors.muted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Initial extends StatelessWidget {
  const _Initial({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: ZanaColors.cream,
      child: Center(
        child: Text(
          name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'Z',
          style: const TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 28,
            color: ZanaColors.copper,
          ),
        ),
      ),
    );
  }
}
