import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ProApi {
  ProApi({
    this.baseUrl = const String.fromEnvironment(
      'API_URL',
      defaultValue: 'http://localhost:3000/v1',
    ),
  });

  final String baseUrl;
  String? token;

  static const _tokenKey = 'zana_pro_token';

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<void> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    token = prefs.getString(_tokenKey);
  }

  Future<void> _persistToken(String? value) async {
    token = value;
    final prefs = await SharedPreferences.getInstance();
    if (value == null) {
      await prefs.remove(_tokenKey);
    } else {
      await prefs.setString(_tokenKey, value);
    }
  }

  Future<void> logout() => _persistToken(null);

  Future<void> requestOtp(String phone) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/otp/request'),
      headers: _headers,
      body: jsonEncode({'phone': phone}),
    );
    if (res.statusCode >= 400) throw Exception(res.body);
  }

  Future<Map<String, dynamic>> verifyOtp(String phone, String code) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/otp/verify'),
      headers: _headers,
      body: jsonEncode({'phone': phone, 'code': code}),
    );
    if (res.statusCode >= 400) throw Exception(res.body);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    await _persistToken(data['token'] as String?);
    return data;
  }

  Future<void> registerFcmToken(String fcmToken) async {
    final res = await http.patch(
      Uri.parse('$baseUrl/auth/me/fcm'),
      headers: _headers,
      body: jsonEncode({'fcmToken': fcmToken}),
    );
    if (res.statusCode >= 400) throw Exception(res.body);
  }

  Future<Map<String, dynamic>> me() async {
    final res = await http.get(Uri.parse('$baseUrl/providers/me'), headers: _headers);
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> readiness() async {
    final res = await http.get(
      Uri.parse('$baseUrl/providers/me/readiness'),
      headers: _headers,
    );
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> body) async {
    final res = await http.patch(
      Uri.parse('$baseUrl/providers/me'),
      headers: _headers,
      body: jsonEncode(body),
    );
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createService(Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse('$baseUrl/providers/me/services'),
      headers: _headers,
      body: jsonEncode(body),
    );
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<void> deleteService(String id) async {
    final res = await http.delete(
      Uri.parse('$baseUrl/providers/me/services/$id'),
      headers: _headers,
    );
    if (res.statusCode >= 400) throw Exception(res.body);
  }

  Future<Map<String, dynamic>> addPhotos(List<String> urls) async {
    final res = await http.post(
      Uri.parse('$baseUrl/providers/me/photos'),
      headers: _headers,
      body: jsonEncode({'urls': urls}),
    );
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<String>> uploadImages(List<String> filePaths) async {
    final req = http.MultipartRequest('POST', Uri.parse('$baseUrl/uploads'));
    if (token != null) req.headers['Authorization'] = 'Bearer $token';
    for (final path in filePaths) {
      req.files.add(await http.MultipartFile.fromPath('files', path));
    }
    final streamed = await req.send();
    final body = await streamed.stream.bytesToString();
    if (streamed.statusCode >= 400) throw Exception(body);
    final data = jsonDecode(body) as Map<String, dynamic>;
    return (data['urls'] as List<dynamic>).cast<String>();
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

  Future<Map<String, dynamic>> confirmPurchase(String purchaseId) async {
    final res = await http.post(
      Uri.parse('$baseUrl/floats/webhook/confirm'),
      headers: _headers,
      body: jsonEncode({'purchaseId': purchaseId}),
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

  Future<void> updateStatus(
    String bookingId,
    String status, {
    String? declineReason,
  }) async {
    final res = await http.patch(
      Uri.parse('$baseUrl/bookings/$bookingId/status'),
      headers: _headers,
      body: jsonEncode({
        'status': status,
        if (declineReason != null && declineReason.isNotEmpty)
          'declineReason': declineReason,
      }),
    );
    if (res.statusCode >= 400) throw Exception(res.body);
  }

  Future<Map<String, dynamic>> getBooking(String id) async {
    final res =
        await http.get(Uri.parse('$baseUrl/bookings/$id'), headers: _headers);
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as Map<String, dynamic>;
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
