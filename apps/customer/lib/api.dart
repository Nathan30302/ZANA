import 'dart:convert';
import 'package:http/http.dart' as http;

class ZanaApi {
  ZanaApi({
    this.baseUrl = const String.fromEnvironment(
      'API_URL',
      defaultValue: 'http://localhost:3000/v1',
    ),
  });

  final String baseUrl;
  String? token;

  /// Default map center: Lusaka CBD
  static const lusakaLat = -15.4167;
  static const lusakaLng = 28.2833;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<List<dynamic>> listProviders({
    String? area,
    String? category,
    double? lat,
    double? lng,
  }) async {
    final uri = Uri.parse('$baseUrl/providers').replace(queryParameters: {
      if (area != null) 'area': area,
      if (category != null) 'category': category,
      if (lat != null) 'lat': lat.toString(),
      if (lng != null) 'lng': lng.toString(),
    });
    final res = await http.get(uri, headers: _headers);
    if (res.statusCode >= 400) {
      throw Exception('Failed to load providers: ${res.body}');
    }
    return jsonDecode(res.body) as List<dynamic>;
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
    token = data['token'] as String?;
    return data;
  }

  Future<Map<String, dynamic>> createBooking({
    required String providerId,
    required String serviceId,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/bookings'),
      headers: _headers,
      body: jsonEncode({
        'providerId': providerId,
        'serviceId': serviceId,
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
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/bookings/$bookingId/review'),
      headers: _headers,
      body: jsonEncode({
        'rating': rating,
        if (comment != null && comment.isNotEmpty) 'comment': comment,
      }),
    );
    if (res.statusCode >= 400) throw Exception(res.body);
    return jsonDecode(res.body) as Map<String, dynamic>;
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
