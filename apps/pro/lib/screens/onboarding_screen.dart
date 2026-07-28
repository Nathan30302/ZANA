import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:zana_pro/api.dart';
import 'package:zana_pro/theme.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key, required this.profile, required this.onDone});

  final Map<String, dynamic> profile;
  final Future<void> Function() onDone;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  late final TextEditingController bioCtrl;
  late final TextEditingController addressCtrl;
  late String area;
  double? lat;
  double? lng;
  late List<dynamic> services;
  late List<dynamic> photos;
  String? error;
  bool busy = false;

  final nameCtrl = TextEditingController();
  final priceCtrl = TextEditingController(text: '80');
  String category = 'BARBER';
  String mode = 'AT_SHOP';

  @override
  void initState() {
    super.initState();
    bioCtrl = TextEditingController(text: widget.profile['bio'] as String? ?? '');
    addressCtrl =
        TextEditingController(text: widget.profile['address'] as String? ?? '');
    area = widget.profile['area'] as String? ?? 'Roma';
    lat = (widget.profile['lat'] as num?)?.toDouble();
    lng = (widget.profile['lng'] as num?)?.toDouble();
    services = List<dynamic>.from(widget.profile['services'] as List? ?? []);
    photos = List<dynamic>.from(widget.profile['photos'] as List? ?? []);
  }

  @override
  void dispose() {
    bioCtrl.dispose();
    addressCtrl.dispose();
    nameCtrl.dispose();
    priceCtrl.dispose();
    super.dispose();
  }

  static const areas = [
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

  Future<void> _saveProfile() async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final updated = await api.updateProfile({
        'bio': bioCtrl.text.trim(),
        'area': area,
        'address': addressCtrl.text.trim(),
        if (lat != null) 'lat': lat,
        if (lng != null) 'lng': lng,
      });
      setState(() {
        services = List<dynamic>.from(updated['services'] as List? ?? services);
        photos = List<dynamic>.from(updated['photos'] as List? ?? photos);
        busy = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile saved')),
        );
      }
    } catch (e) {
      setState(() {
        error = e.toString();
        busy = false;
      });
    }
  }

  Future<void> _pinHere() async {
    try {
      final enabled = await Geolocator.isLocationServiceEnabled();
      if (!enabled) throw Exception('Location services off');
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        throw Exception('Location permission denied');
      }
      final pos = await Geolocator.getCurrentPosition();
      setState(() {
        lat = pos.latitude;
        lng = pos.longitude;
      });
      await _saveProfile();
    } catch (e) {
      setState(() => error = e.toString());
    }
  }

  Future<void> _addService() async {
    if (nameCtrl.text.trim().isEmpty) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await api.createService({
        'name': nameCtrl.text.trim(),
        'category': category,
        'mode': mode,
        'priceZmw': int.tryParse(priceCtrl.text.trim()) ?? 80,
        'durationMin': 30,
      });
      nameCtrl.clear();
      final me = await api.me();
      setState(() {
        services = List<dynamic>.from(me['services'] as List? ?? []);
        busy = false;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        busy = false;
      });
    }
  }

  Future<void> _pickPhotos() async {
    final picker = ImagePicker();
    final files = await picker.pickMultiImage(imageQuality: 80);
    if (files.isEmpty) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final urls = await api.uploadImages(files.map((f) => f.path).toList());
      final me = await api.addPhotos(urls);
      setState(() {
        photos = List<dynamic>.from(me['photos'] as List? ?? []);
        busy = false;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        busy = false;
      });
    }
  }

  bool get ready =>
      services.where((s) => (s as Map)['isActive'] != false).isNotEmpty &&
      lat != null &&
      lng != null;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Set up your shop'),
        actions: [
          TextButton(
            onPressed: ready
                ? () async {
                    await widget.onDone();
                    if (context.mounted) Navigator.of(context).pop();
                  }
                : null,
            child: const Text('Done'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Add a pin, services, and portfolio so customers can book you.',
            style: TextStyle(color: ZanaColors.muted),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: bioCtrl,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Bio',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 10),
          DropdownButtonFormField<String>(
            // ignore: deprecated_member_use
            value: area,
            decoration: const InputDecoration(
              labelText: 'Area',
              border: OutlineInputBorder(),
            ),
            items: areas
                .map((a) => DropdownMenuItem(value: a, child: Text(a)))
                .toList(),
            onChanged: (v) => setState(() => area = v ?? area),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: addressCtrl,
            decoration: const InputDecoration(
              labelText: 'Address / landmark',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            lat == null
                ? 'No pin set'
                : 'Pin: ${lat!.toStringAsFixed(4)}, ${lng!.toStringAsFixed(4)}',
            style: const TextStyle(color: ZanaColors.muted),
          ),
          Row(
            children: [
              OutlinedButton(onPressed: _pinHere, child: const Text('Pin my location')),
              const SizedBox(width: 8),
              FilledButton(
                style: FilledButton.styleFrom(backgroundColor: ZanaColors.charcoal),
                onPressed: busy ? null : _saveProfile,
                child: const Text('Save profile'),
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Text('Services', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
          ...services.map((raw) {
            final s = raw as Map<String, dynamic>;
            if (s['isActive'] == false) return const SizedBox.shrink();
            return ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(s['name'] as String? ?? 'Service'),
              subtitle: Text('${s['category']} · K${s['priceZmw']}'),
              trailing: IconButton(
                icon: const Icon(Icons.delete_outline),
                onPressed: () async {
                  await api.deleteService(s['id'] as String);
                  final me = await api.me();
                  setState(() {
                    services = List<dynamic>.from(me['services'] as List? ?? []);
                  });
                },
              ),
            );
          }),
          TextField(
            controller: nameCtrl,
            decoration: const InputDecoration(
              labelText: 'New service name',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  // ignore: deprecated_member_use
                  value: category,
                  decoration: const InputDecoration(
                    labelText: 'Category',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    'BARBER',
                    'SALON',
                    'NAILS',
                    'BRIDAL',
                    'MOBILE',
                  ]
                      .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                      .toList(),
                  onChanged: (v) => setState(() => category = v ?? category),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 100,
                child: TextField(
                  controller: priceCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'K',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            // ignore: deprecated_member_use
            value: mode,
            decoration: const InputDecoration(
              labelText: 'Mode',
              border: OutlineInputBorder(),
            ),
            items: const [
              DropdownMenuItem(value: 'AT_SHOP', child: Text('At shop')),
              DropdownMenuItem(value: 'COMES_TO_YOU', child: Text('Comes to you')),
            ],
            onChanged: (v) => setState(() => mode = v ?? mode),
          ),
          const SizedBox(height: 8),
          OutlinedButton(onPressed: busy ? null : _addService, child: const Text('Add service')),
          const SizedBox(height: 24),
          const Text('Portfolio', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
          Text('${photos.length} photos', style: const TextStyle(color: ZanaColors.muted)),
          OutlinedButton(onPressed: busy ? null : _pickPhotos, child: const Text('Upload photos')),
          if (error != null) ...[
            const SizedBox(height: 12),
            Text(error!, style: const TextStyle(color: Colors.red)),
          ],
          if (!ready)
            const Padding(
              padding: EdgeInsets.only(top: 16),
              child: Text(
                'Need at least one service and a map pin before going online.',
                style: TextStyle(color: ZanaColors.muted),
              ),
            ),
        ],
      ),
    );
  }
}
