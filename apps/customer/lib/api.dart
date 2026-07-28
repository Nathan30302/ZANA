import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ZanaApi {
  ZanaApi({
    this.baseUrl = const String.fromEnvironment(
      'API_URL',
      defaultValue: 'http://localhost:3000/v1',
    ),
  });

  final String baseUrl;
  String? token;

  static const lusakaLat = -15.4167;
  static const lusakaLng = 28.2833;
  static const _tokenKey = 'zana_token';

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

  Future<List<dynamic>> listProviders({
    String? area,
    String? category,
    String? q,
    double? lat,
    double? lng,
  }) async {
    final uri = Uri.parse('$baseUrl/providers').replace(queryParameters: {
      if (area != null) 'area': area,
      if (category != null) 'category': category,
      if (q != null && q.isNotEmpty) 'q': q,
      if (lat != null) 'lat': lat.toString(),
      if (lng != null) 'lng': lng.toString(),
    });
    final res = await http.get(uri, headers: _headers);
    if (res.statusCode >= 400) {
      throw Exception('Failed to load providers: ${res.body}');
    }
    return jsonDecode(res.body) as List<dynamic>;
  }

  Future<List<String>> listAreas() async {
    final res = await http.get(Uri.parse('$baseUrl/meta/areas'), headers: _headers);
    if (res.statusCode >= 400) throw Exception(res.body);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return (data['areas'] as List<dynamic>).cast<String>();
  }

  Future<Map<String, dynamic>> getProvider(String id) async {
    final res =
        await http.get(Uri.parse('$baseUrl/providers/$id'), headers: _headers);
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

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

  Future<Map<String, dynamic>> createBooking({
    required String providerId,
    required String serviceId,
    DateTime? scheduledAt,
    double? customerLat,
    double? customerLng,
    String? customerAddress,
    String? notes,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/bookings'),
      headers: _headers,
      body: jsonEncode({
        'providerId': providerId,
        'serviceId': serviceId,
        if (scheduledAt != null) 'scheduledAt': scheduledAt.toUtc().toIso8601String(),
        if (customerLat != null) 'customerLat': customerLat,
        if (customerLng != null) 'customerLng': customerLng,
        if (customerAddress != null) 'customerAddress': customerAddress,
        if (notes != null) 'notes': notes,
      }),
    );
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<dynamic>> listBookings() async {
    final res = await http.get(
      Uri.parse('$baseUrl/bookings?as=customer'),
      headers: _headers,
    );
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as List<dynamic>;
  }

  Future<Map<String, dynamic>> getBooking(String id) async {
    final res =
        await http.get(Uri.parse('$baseUrl/bookings/$id'), headers: _headers);
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateBookingStatus(
    String id,
    String status,
  ) async {
    final res = await http.patch(
      Uri.parse('$baseUrl/bookings/$id/status'),
      headers: _headers,
      body: jsonEncode({'status': status}),
    );
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> submitReview({
    required String bookingId,
    required int rating,
    String? comment,
    String? photoUrl,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/bookings/$bookingId/review'),
      headers: _headers,
      body: jsonEncode({
        'rating': rating,
        if (comment != null && comment.isNotEmpty) 'comment': comment,
        if (photoUrl != null) 'photoUrl': photoUrl,
      }),
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

  Future<List<dynamic>> providerReviews(String providerId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/providers/$providerId/reviews'),
      headers: _headers,
    );
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as List<dynamic>;
  }
}

final api = ZanaApi();
