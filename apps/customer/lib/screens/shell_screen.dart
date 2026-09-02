import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/bookings_screen.dart';
import 'package:zana_customer/screens/favorites_screen.dart';
import 'package:zana_customer/screens/home_screen.dart';
import 'package:zana_customer/screens/nearby_map_screen.dart';
import 'package:zana_customer/theme.dart';

/// Root shell with floating premium bottom navigation.
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

  Future<void> _ensureMapData() async {
    if (mapProviders.isNotEmpty || mapLoading) return;
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
      backgroundColor: ZanaColors.cream,
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
                ),
          const FavoritesScreen(embedded: true),
          const BookingsScreen(embedded: true),
        ],
      ),
      extendBody: true,
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: SafeArea(
          top: false,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
            decoration: BoxDecoration(
              color: ZanaColors.paper.withValues(alpha: 0.96),
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: ZanaColors.espresso.withValues(alpha: 0.12),
                  blurRadius: 32,
                  offset: const Offset(0, 8),
                ),
                BoxShadow(
                  color: ZanaColors.espresso.withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
              border: Border.all(
                color: ZanaColors.ink.withValues(alpha: 0.05),
              ),
            ),
            child: Row(
              children: [
                _NavItem(
                  icon: Icons.spa_outlined,
                  activeIcon: Icons.spa_rounded,
                  label: 'Discover',
                  selected: index == 0,
                  onTap: () => _onTab(0),
                ),
                _NavItem(
                  icon: Icons.explore_outlined,
                  activeIcon: Icons.explore_rounded,
                  label: 'Map',
                  selected: index == 1,
                  onTap: () => _onTab(1),
                ),
                _NavItem(
                  icon: Icons.bookmark_outline_rounded,
                  activeIcon: Icons.bookmark_rounded,
                  label: 'Saved',
                  selected: index == 2,
                  onTap: () => _onTab(2),
                ),
                _NavItem(
                  icon: Icons.event_note_outlined,
                  activeIcon: Icons.event_note_rounded,
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
    return Expanded(
      child: Material(
        color: selected ? ZanaColors.espresso : Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOutCubic,
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  selected ? activeIcon : icon,
                  color: selected ? ZanaColors.gold : ZanaColors.muted,
                  size: 22,
                ),
                const SizedBox(height: 3),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    color: selected ? Colors.white : ZanaColors.muted,
                    letterSpacing: 0.1,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
