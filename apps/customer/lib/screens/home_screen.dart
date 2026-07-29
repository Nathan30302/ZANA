import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/auth_sheet.dart';
import 'package:zana_customer/screens/book_now_sheet.dart';
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
  bool onlineOnly = false;

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
      online: onlineOnly ? true : null,
      radiusKm: onlineOnly ? 12 : null,
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
              padding: const EdgeInsets.fromLTRB(20, 14, 12, 0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Expanded(
                    child: ZanaWordmark(markSize: 44),
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
                    )
                  else
                    FilledButton.tonal(
                      onPressed: () async {
                        final ok = await showAuthSheet(context);
                        if (!mounted) return;
                        if (ok) setState(() {});
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: ZanaColors.ink,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 10,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Sign in'),
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
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
              child: Material(
                color: ZanaColors.ink,
                borderRadius: BorderRadius.circular(18),
                child: InkWell(
                  borderRadius: BorderRadius.circular(18),
                  onTap: () => showBookNowFlow(
                    context,
                    userLat: userLat,
                    userLng: userLng,
                    category: category,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 14, 14, 14),
                    child: Row(
                      children: [
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: ZanaColors.copper,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.bolt_rounded,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Need it now?',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 15,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'See who’s online nearby — request & track live',
                                style: TextStyle(
                                  color: Color(0xFFD6D3D1),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(
                          Icons.arrow_forward_rounded,
                          color: Colors.white,
                        ),
                      ],
                    ),
                  ),
                ),
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
                    label: 'Available now',
                    icon: Icons.bolt_rounded,
                    selected: onlineOnly,
                    onTap: () {
                      onlineOnly = !onlineOnly;
                      _reload();
                    },
                  ),
                  const SizedBox(width: 8),
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
              height: 44,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                scrollDirection: Axis.horizontal,
                itemCount: categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  final c = categories[i];
                  return _FilterChip(
                    label: _categoryLabel(c),
                    icon: _categoryIcon(c),
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
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 6),
              child: Row(
                children: [
                  Text(
                    onlineOnly ? 'Online near you' : 'Near you',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: ZanaColors.ink,
                        ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: ZanaColors.copper.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: const Text(
                      'Lusaka',
                      style: TextStyle(
                        color: ZanaColors.copper,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
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
                    return const Center(
                      child: CircularProgressIndicator(color: ZanaColors.copper),
                    );
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
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(28),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              onlineOnly
                                  ? Icons.bolt_rounded
                                  : Icons.search_off_rounded,
                              size: 36,
                              color: ZanaColors.copper.withValues(alpha: 0.7),
                            ),
                            const SizedBox(height: 14),
                            Text(
                              onlineOnly
                                  ? 'Nobody online nearby'
                                  : 'No matches',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w800),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              onlineOnly
                                  ? 'Try again in a bit, or browse all pros.'
                                  : 'Try another area or category.',
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: ZanaColors.muted),
                            ),
                          ],
                        ),
                      ),
                    );
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 14),
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

  IconData _categoryIcon(String c) {
    switch (c) {
      case 'ALL':
        return Icons.near_me_rounded;
      case 'BARBER':
        return Icons.content_cut_rounded;
      case 'SALON':
        return Icons.spa_rounded;
      case 'MOBILE':
        return Icons.directions_walk_rounded;
      default:
        return Icons.circle;
    }
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.emphasis = false,
    this.icon,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final bool emphasis;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final bg = selected
        ? (emphasis ? ZanaColors.ink : ZanaColors.copper)
        : ZanaColors.paper;
    final fg = selected ? Colors.white : ZanaColors.ink;
    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: selected
                ? null
                : Border.all(color: ZanaColors.ink.withValues(alpha: 0.08)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 16, color: fg),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: fg,
                ),
              ),
            ],
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
    final type = provider['type'] as String? ?? '';

    return Material(
      color: ZanaColors.paper,
      elevation: 0,
      borderRadius: BorderRadius.circular(22),
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
        child: Ink(
          decoration: BoxDecoration(
            border: Border.all(color: ZanaColors.ink.withValues(alpha: 0.05)),
            borderRadius: BorderRadius.circular(22),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AspectRatio(
                aspectRatio: 16 / 9,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    cover != null
                        ? Image.network(
                            cover,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => _Initial(name: name),
                          )
                        : _Initial(name: name),
                    Positioned(
                      left: 12,
                      top: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: online
                              ? const Color(0xFFECFDF5)
                              : Colors.white.withValues(alpha: 0.92),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          online ? 'Online now' : 'Offline',
                          style: TextStyle(
                            color: online
                                ? const Color(0xFF047857)
                                : ZanaColors.muted,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                    if (count > 0)
                      Positioned(
                        right: 12,
                        top: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.55),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            '${rating.toStringAsFixed(1)} ★',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 17,
                        color: ZanaColors.ink,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${provider['area']} · $type'
                      '${km != null ? ' · ${km.toStringAsFixed(1)} km' : ''}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: ZanaColors.muted,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Text(
                          count > 0 ? 'Book now' : 'New on ZANA',
                          style: const TextStyle(
                            color: ZanaColors.copper,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                        const Spacer(),
                        const Icon(
                          Icons.arrow_forward_rounded,
                          size: 18,
                          color: ZanaColors.copper,
                        ),
                      ],
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

class _Initial extends StatelessWidget {
  const _Initial({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFF3EDE4), Color(0xFFE7D5C4)],
        ),
      ),
      child: Center(
        child: Text(
          name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'Z',
          style: const TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 42,
            color: ZanaColors.copper,
          ),
        ),
      ),
    );
  }
}
