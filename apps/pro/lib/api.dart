import 'dart:convert';
import 'package:http/http.dart' as http;

class ProApi {
  ProApi({this.baseUrl = const String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://localhost:3000/v1',
  )});

  final String baseUrl;
  String? token;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<void> loginAsSeedProvider() async {
    await http.post(
      Uri.parse('$baseUrl/auth/otp/request'),
      headers: _headers,
      body: jsonEncode({'phone': '+260970000001'}),
    );
    final res = await http.post(
      Uri.parse('$baseUrl/auth/otp/verify'),
      headers: _headers,
      body: jsonEncode({'phone': '+260970000001', 'code': '123456'}),
    );
    if (res.statusCode >= 400) throw Exception(res.body);
    token = (jsonDecode(res.body) as Map<String, dynamic>)['token'] as String?;
  }

  Future<void> registerFcmToken(String fcmToken) async {
    final res = await http.patch(
      Uri.parse('$baseUrl/auth/me/fcm'),
      headers: _headers,
      body: jsonEncode({'fcmToken': fcmToken}),
    );
    if (res.statusCode >= 400) throw Exception(res.body);
  }

  Future<Map<String, dynamic>> balance() async {
    final res = await http.get(Uri.parse('$baseUrl/floats/balance'), headers: _headers);
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<dynamic>> packages() async {
    final res = await http.get(Uri.parse('$baseUrl/floats/packages'), headers: _headers);
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as List<dynamic>;
  }

  Future<Map<String, dynamic>> purchase({
    required String packageId,
    String method = 'MTN_MOMO',
    String? phone,
    bool simulate = true,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/floats/purchase'),
      headers: _headers,
      body: jsonEncode({
        'packageId': packageId,
        'method': method,
        if (phone != null) 'phone': phone,
        'simulate': simulate,
      }),
    );
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> setOnline(bool isOnline) async {
    final res = await http.patch(
      Uri.parse('$baseUrl/providers/me/online'),
      headers: _headers,
      body: jsonEncode({'isOnline': isOnline}),
    );
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<dynamic>> jobs() async {
    final res = await http.get(
      Uri.parse('$baseUrl/bookings?as=provider'),
      headers: _headers,
    );
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as List<dynamic>;
  }

  Future<void> updateStatus(String bookingId, String status) async {
    final res = await http.patch(
      Uri.parse('$baseUrl/bookings/$bookingId/status'),
      headers: _headers,
      body: jsonEncode({'status': status}),
    );
    if (res.statusCode >= 400) throw Exception(res.body);
  }

  Future<void> updateLocation(String bookingId, double lat, double lng) async {
    final res = await http.patch(
      Uri.parse('$baseUrl/bookings/$bookingId/location'),
      headers: _headers,
      body: jsonEncode({'lat': lat, 'lng': lng}),
    );
    if (res.statusCode >= 400) throw Exception(res.body);
  }
}

final api = ProApi();
