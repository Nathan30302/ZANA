import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/bookings_screen.dart';
import 'package:zana_customer/screens/favorites_screen.dart';
import 'package:zana_customer/screens/home_screen.dart';
import 'package:zana_customer/screens/nearby_map_screen.dart';
import 'package:zana_customer/theme.dart';

/// Root shell: Discover + bottom nav for Map, Favorites, Bookings.
class CustomerShell extends StatefulWidget {
  const CustomerShell({super.key});

  @override
  State<CustomerShell> createState() => _CustomerShellState();
}

class _CustomerShellState extends State<CustomerShell> {
  int index = 0;
  double userLat = ZanaApi.lusakaLat;
  double userLng = ZanaApi.lusakaLng;
  List<dynamic> mapProviders = [];
  bool mapLoading = false;

  @override
  void initState() {
    super.initState();
    _resolveLocation();
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
      if (!mounted) return;
      setState(() {
        userLat = pos.latitude;
        userLng = pos.longitude;
      });
    } catch (_) {}
  }

  Future<void> _ensureMapData({bool force = false}) async {
    if (!force && (mapProviders.isNotEmpty || mapLoading)) return;
    setState(() => mapLoading = true);
    try {
      final items = await api.listProviders(lat: userLat, lng: userLng);
      if (!mounted) return;
      setState(() {
        mapProviders = items;
        mapLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => mapLoading = false);
    }
  }

  void _onTab(int i) {
    setState(() => index = i);
    if (i == 1) _ensureMapData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: index,
        children: [
          HomeScreen(
            userLat: userLat,
            userLng: userLng,
            onProvidersLoaded: (items) {
              mapProviders = items;
            },
            onLocationResolved: (lat, lng) {
              setState(() {
                userLat = lat;
                userLng = lng;
              });
            },
          ),
          mapLoading && mapProviders.isEmpty
              ? const Center(
                  child: CircularProgressIndicator(color: ZanaColors.copper),
                )
              : NearbyMapScreen(
                  providers: mapProviders,
                  userLat: userLat,
                  userLng: userLng,
                  embedded: true,
                  onRefresh: () => _ensureMapData(force: true),
                ),
          const FavoritesScreen(embedded: true),
          const BookingsScreen(embedded: true),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: ZanaColors.paper.withValues(alpha: 0.96),
          border: Border(
            top: BorderSide(color: ZanaColors.ink.withValues(alpha: 0.06)),
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
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
            child: Row(
              children: [
                _NavItem(
                  icon: Icons.home_outlined,
                  activeIcon: Icons.home_rounded,
                  label: 'Discover',
                  selected: index == 0,
                  onTap: () => _onTab(0),
                ),
                _NavItem(
                  icon: Icons.map_outlined,
                  activeIcon: Icons.map_rounded,
                  label: 'Map',
                  selected: index == 1,
                  onTap: () => _onTab(1),
                ),
                _NavItem(
                  icon: Icons.favorite_border,
                  activeIcon: Icons.favorite_rounded,
                  label: 'Saved',
                  selected: index == 2,
                  onTap: () => _onTab(2),
                ),
                _NavItem(
                  icon: Icons.calendar_month_outlined,
                  activeIcon: Icons.calendar_month,
                  label: 'Bookings',
                  selected: index == 3,
                  onTap: () => _onTab(3),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected ? ZanaColors.copper : ZanaColors.muted;
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: selected
                ? ZanaColors.copper.withValues(alpha: 0.08)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(selected ? activeIcon : icon, color: color, size: 24),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: color,
                  letterSpacing: 0.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
