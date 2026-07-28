import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/bookings_screen.dart';
import 'package:zana_customer/screens/nearby_map_screen.dart';
import 'package:zana_customer/screens/provider_screen.dart';
import 'package:zana_customer/theme.dart';

const categories = ['ALL', 'BARBER', 'SALON', 'NAILS', 'BRIDAL', 'MOBILE'];

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String category = 'ALL';
  String? area;
  String query = '';
  late Future<List<dynamic>> future;
  List<dynamic> lastProviders = [];
  List<String> areas = [];
  double userLat = ZanaApi.lusakaLat;
  double userLng = ZanaApi.lusakaLng;
  final searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
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
    lastProviders = items;
    return items;
  }

  void _reload() {
    setState(() {
      future = _load();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'ZANA',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.w800,
                                letterSpacing: 2,
                                color: ZanaColors.copper,
                              ),
                        ),
                        Text(
                          'Lusaka · find your next cut',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: ZanaColors.muted,
                              ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: 'Map',
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => NearbyMapScreen(
                            providers: lastProviders,
                            userLat: userLat,
                            userLng: userLng,
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.map_outlined),
                  ),
                  IconButton(
                    tooltip: 'My bookings',
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const BookingsScreen()),
                      );
                    },
                    icon: const Icon(Icons.calendar_month_outlined),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: searchCtrl,
                decoration: InputDecoration(
                  hintText: 'Search salons, barbers, stylists',
                  filled: true,
                  fillColor: ZanaColors.paper,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none,
                  ),
                  prefixIcon: const Icon(Icons.search),
                ),
                onSubmitted: (v) {
                  query = v.trim();
                  _reload();
                },
                textInputAction: TextInputAction.search,
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 36,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: const Text('All areas'),
                        selected: area == null,
                        onSelected: (_) {
                          area = null;
                          _reload();
                        },
                        selectedColor: ZanaColors.charcoal,
                        labelStyle: TextStyle(
                          color: area == null ? Colors.white : ZanaColors.ink,
                        ),
                      ),
                    ),
                    ...areas.map(
                      (a) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(a),
                          selected: area == a,
                          onSelected: (_) {
                            area = a;
                            _reload();
                          },
                          selectedColor: ZanaColors.charcoal,
                          labelStyle: TextStyle(
                            color: area == a ? Colors.white : ZanaColors.ink,
                          ),
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
                  scrollDirection: Axis.horizontal,
                  itemCount: categories.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, i) {
                    final c = categories[i];
                    final selected = c == category;
                    return ChoiceChip(
                      label: Text(c == 'ALL' ? 'Nearby' : c),
                      selected: selected,
                      onSelected: (_) {
                        category = c;
                        _reload();
                      },
                      selectedColor: ZanaColors.charcoal,
                      labelStyle: TextStyle(
                        color: selected ? Colors.white : ZanaColors.ink,
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: FutureBuilder<List<dynamic>>(
                  future: future,
                  builder: (context, snap) {
                    if (snap.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (snap.hasError) {
                      return Center(
                        child: Text(
                          'Could not reach API.\nStart apps/api on :3000\n${snap.error}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: ZanaColors.muted),
                        ),
                      );
                    }
                    final items = snap.data ?? [];
                    if (items.isEmpty) {
                      return const Center(child: Text('No providers match.'));
                    }
                    return ListView.separated(
                      itemCount: items.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, i) {
                        final p = items[i] as Map<String, dynamic>;
                        final km = (p['distanceKm'] as num?)?.toDouble();
                        final cover = p['coverPhotoUrl'] as String?;
                        final rating = (p['ratingAvg'] as num?)?.toDouble() ?? 0;
                        final count = p['ratingCount'] as int? ?? 0;
                        return Material(
                          color: ZanaColors.paper,
                          borderRadius: BorderRadius.circular(16),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) =>
                                      ProviderScreen(providerId: p['id'] as String),
                                ),
                              );
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 28,
                                    backgroundColor: ZanaColors.cream,
                                    backgroundImage: cover != null
                                        ? NetworkImage(cover)
                                        : null,
                                    child: cover == null
                                        ? Text(
                                            (p['displayName'] as String).substring(0, 1),
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              color: ZanaColors.copper,
                                            ),
                                          )
                                        : null,
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          p['displayName'] as String,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w700,
                                            fontSize: 16,
                                          ),
                                        ),
                                        Text(
                                          '${p['area']} · ${p['type']}'
                                          '${km != null ? ' · ${km.toStringAsFixed(1)} km' : ''}',
                                          style: const TextStyle(color: ZanaColors.muted),
                                        ),
                                        Text(
                                          p['isOnline'] == true ? 'Online now' : 'Offline',
                                          style: TextStyle(
                                            color: p['isOnline'] == true
                                                ? Colors.green.shade700
                                                : ZanaColors.muted,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Text(
                                    count > 0
                                        ? '${rating.toStringAsFixed(1)}★'
                                        : 'New',
                                    style: const TextStyle(fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
