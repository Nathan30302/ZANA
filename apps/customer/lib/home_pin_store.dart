import 'package:shared_preferences/shared_preferences.dart';

class HomePin {
  const HomePin({
    required this.lat,
    required this.lng,
    required this.address,
  });

  final double lat;
  final double lng;
  final String address;
}

/// Client-side saved home / work pin for one-tap comes-to-you booking.
class HomePinStore {
  HomePinStore._();
  static final HomePinStore instance = HomePinStore._();

  static const _latKey = 'zana_home_lat';
  static const _lngKey = 'zana_home_lng';
  static const _addrKey = 'zana_home_address';

  Future<HomePin?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final lat = prefs.getDouble(_latKey);
    final lng = prefs.getDouble(_lngKey);
    final address = prefs.getString(_addrKey);
    if (lat == null || lng == null || address == null || address.isEmpty) {
      return null;
    }
    return HomePin(lat: lat, lng: lng, address: address);
  }

  Future<void> save(HomePin pin) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble(_latKey, pin.lat);
    await prefs.setDouble(_lngKey, pin.lng);
    await prefs.setString(_addrKey, pin.address);
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_latKey);
    await prefs.remove(_lngKey);
    await prefs.remove(_addrKey);
  }
}
