import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:zana_pro/api.dart';
import 'package:zana_pro/theme.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({
    super.key,
    required this.profile,
    required this.onDone,
    this.embedded = false,
  });

  final Map<String, dynamic> profile;
  final Future<void> Function() onDone;
  final bool embedded;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int step = 0;
  late final TextEditingController bioCtrl;
  late final TextEditingController addressCtrl;
  late final TextEditingController hoursCtrl;
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

  static const steps = ['Profile', 'Location', 'Services', 'Portfolio'];

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

  @override
  void initState() {
    super.initState();
    bioCtrl = TextEditingController(text: widget.profile['bio'] as String? ?? '');
    addressCtrl =
        TextEditingController(text: widget.profile['address'] as String? ?? '');
    hoursCtrl = TextEditingController(
      text: widget.profile['hours'] as String? ?? 'Mon–Sat 08:00–18:00',
    );
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
    hoursCtrl.dispose();
    nameCtrl.dispose();
    priceCtrl.dispose();
    super.dispose();
  }

  bool get ready =>
      services.where((s) => (s as Map)['isActive'] != false).isNotEmpty &&
      lat != null &&
      lng != null &&
      hoursCtrl.text.trim().isNotEmpty &&
      bioCtrl.text.trim().isNotEmpty;

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
        'hours': hoursCtrl.text.trim(),
        if (lat != null) 'lat': lat,
        if (lng != null) 'lng': lng,
      });
      setState(() {
        services = List<dynamic>.from(updated['services'] as List? ?? services);
        photos = List<dynamic>.from(updated['photos'] as List? ?? photos);
        busy = false;
      });
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

  Future<void> _next() async {
    if (step == 0 || step == 1) {
      await _saveProfile();
      if (error != null) return;
    }
    if (step < steps.length - 1) {
      setState(() => step += 1);
    } else if (ready) {
      await widget.onDone();
      if (mounted && !widget.embedded) Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ZanaColors.cream,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 16, 0),
              child: Row(
                children: [
                  if (!widget.embedded)
                    IconButton(
                      onPressed: () {
                        if (step == 0) {
                          Navigator.of(context).maybePop();
                        } else {
                          setState(() => step -= 1);
                        }
                      },
                      icon: const Icon(Icons.arrow_back_rounded),
                    )
                  else if (step > 0)
                    IconButton(
                      onPressed: () => setState(() => step -= 1),
                      icon: const Icon(Icons.arrow_back_rounded),
                    )
                  else
                    const SizedBox(width: 48),
                  const Expanded(
                    child: ZanaWordmark(
                      markSize: 32,
                      compact: true,
                      pro: true,
                      showSlogan: false,
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Shop setup',
                    style: GoogleFonts.syne(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Step ${step + 1} of ${steps.length} · ${steps[step]}',
                    style: const TextStyle(
                      color: ZanaColors.muted,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      for (var i = 0; i < steps.length; i++) ...[
                        if (i > 0)
                          Expanded(
                            child: Container(
                              height: 3,
                              color: i <= step
                                  ? ZanaColors.copper
                                  : ZanaColors.line,
                            ),
                          ),
                        Container(
                          width: 10,
                          height: 10,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: i <= step
                                ? ZanaColors.copper
                                : ZanaColors.line,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
                children: [
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 220),
                    child: KeyedSubtree(
                      key: ValueKey(step),
                      child: switch (step) {
                        0 => _profileStep(),
                        1 => _locationStep(),
                        2 => _servicesStep(),
                        _ => _portfolioStep(),
                      },
                    ),
                  ),
                  if (error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      error!,
                      style: TextStyle(color: Colors.red.shade700),
                    ),
                  ],
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              decoration: BoxDecoration(
                color: ZanaColors.paper,
                border: Border(
                  top: BorderSide(color: ZanaColors.ink.withValues(alpha: 0.06)),
                ),
              ),
              child: SafeArea(
                top: false,
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: ZanaColors.copper,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    onPressed: busy
                        ? null
                        : () async {
                            if (step == steps.length - 1 && !ready) {
                              setState(() {
                                error =
                                    'Need bio, hours, one service, and a map pin.';
                              });
                              return;
                            }
                            await _next();
                          },
                    child: Text(
                      busy
                          ? 'Saving…'
                          : step == steps.length - 1
                              ? (ready ? 'Finish setup' : 'Complete checklist')
                              : 'Continue',
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _section(String title, String body, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20),
        ),
        const SizedBox(height: 6),
        Text(body, style: const TextStyle(color: ZanaColors.muted, height: 1.35)),
        const SizedBox(height: 16),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: ZanaColors.paper,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: ZanaColors.ink.withValues(alpha: 0.05)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: children,
          ),
        ),
      ],
    );
  }

  Widget _profileStep() {
    return _section(
      'Tell customers about you',
      'Bio and hours help people trust your shop before they book.',
      [
        TextField(
          controller: bioCtrl,
          maxLines: 3,
          decoration: const InputDecoration(labelText: 'Bio'),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: hoursCtrl,
          decoration: const InputDecoration(
            labelText: 'Opening hours',
            hintText: 'Mon–Sat 08:00–18:00',
          ),
        ),
        const SizedBox(height: 10),
        DropdownButtonFormField<String>(
          // ignore: deprecated_member_use
          value: area,
          decoration: const InputDecoration(labelText: 'Area'),
          items: areas
              .map((a) => DropdownMenuItem(value: a, child: Text(a)))
              .toList(),
          onChanged: (v) => setState(() => area = v ?? area),
        ),
      ],
    );
  }

  Widget _locationStep() {
    return _section(
      'Pin your shop',
      'Customers find you on the map. Use your current location or a landmark.',
      [
        TextField(
          controller: addressCtrl,
          decoration: const InputDecoration(labelText: 'Address / landmark'),
        ),
        const SizedBox(height: 14),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: lat == null ? ZanaColors.sand : const Color(0xFFECFDF5),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            children: [
              Icon(
                lat == null ? Icons.location_off_rounded : Icons.place_rounded,
                color: lat == null ? ZanaColors.muted : const Color(0xFF047857),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  lat == null
                      ? 'No pin yet — tap below to drop one'
                      : 'Pinned ${lat!.toStringAsFixed(4)}, ${lng!.toStringAsFixed(4)}',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: lat == null
                        ? ZanaColors.muted
                        : const Color(0xFF047857),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: busy ? null : _pinHere,
            icon: const Icon(Icons.my_location_rounded),
            label: const Text('Use my location'),
          ),
        ),
      ],
    );
  }

  Widget _servicesStep() {
    final active = services
        .where((s) => (s as Map)['isActive'] != false)
        .cast<Map<String, dynamic>>()
        .toList();
    return _section(
      'What do you offer?',
      'Add at least one service with a price so customers can book now.',
      [
        if (active.isEmpty)
          const Padding(
            padding: EdgeInsets.only(bottom: 12),
            child: Text(
              'No services yet',
              style: TextStyle(color: ZanaColors.muted),
            ),
          )
        else
          ...active.map((s) {
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.fromLTRB(12, 10, 4, 10),
              decoration: BoxDecoration(
                color: ZanaColors.sand,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          s['name'] as String? ?? 'Service',
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                        Text(
                          '${s['category']} · K${s['priceZmw']}',
                          style: const TextStyle(
                            color: ZanaColors.muted,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline_rounded),
                    onPressed: () async {
                      await api.deleteService(s['id'] as String);
                      final me = await api.me();
                      setState(() {
                        services =
                            List<dynamic>.from(me['services'] as List? ?? []);
                      });
                    },
                  ),
                ],
              ),
            );
          }),
        const SizedBox(height: 8),
        TextField(
          controller: nameCtrl,
          decoration: const InputDecoration(labelText: 'New service name'),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: DropdownButtonFormField<String>(
                // ignore: deprecated_member_use
                value: category,
                decoration: const InputDecoration(labelText: 'Category'),
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
              width: 96,
              child: TextField(
                controller: priceCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'K'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        DropdownButtonFormField<String>(
          // ignore: deprecated_member_use
          value: mode,
          decoration: const InputDecoration(labelText: 'Mode'),
          items: const [
            DropdownMenuItem(value: 'AT_SHOP', child: Text('At shop')),
            DropdownMenuItem(
              value: 'COMES_TO_YOU',
              child: Text('Comes to you'),
            ),
          ],
          onChanged: (v) => setState(() => mode = v ?? mode),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: busy ? null : _addService,
            child: const Text('Add service'),
          ),
        ),
      ],
    );
  }

  Widget _portfolioStep() {
    return _section(
      'Show your work',
      'Portfolio photos help customers choose you. Optional but recommended.',
      [
        Text(
          '${photos.length} photo${photos.length == 1 ? '' : 's'}',
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            color: ZanaColors.muted,
          ),
        ),
        const SizedBox(height: 12),
        if (photos.isNotEmpty)
          SizedBox(
            height: 88,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: photos.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final url = (photos[i] as Map)['url'] as String?;
                if (url == null) return const SizedBox.shrink();
                return ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    url,
                    width: 88,
                    height: 88,
                    fit: BoxFit.cover,
                  ),
                );
              },
            ),
          ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: busy ? null : _pickPhotos,
            icon: const Icon(Icons.photo_library_outlined),
            label: const Text('Upload photos'),
          ),
        ),
        const SizedBox(height: 16),
        _Checklist(
          items: [
            ('Bio', bioCtrl.text.trim().isNotEmpty),
            ('Hours', hoursCtrl.text.trim().isNotEmpty),
            ('Map pin', lat != null && lng != null),
            ('Service', services.any((s) => (s as Map)['isActive'] != false)),
          ],
        ),
      ],
    );
  }
}

class _Checklist extends StatelessWidget {
  const _Checklist({required this.items});

  final List<(String, bool)> items;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: items.map((e) {
        final (label, done) = e;
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            children: [
              Icon(
                done ? Icons.check_circle_rounded : Icons.radio_button_unchecked,
                size: 20,
                color: done ? const Color(0xFF047857) : ZanaColors.muted,
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: done ? ZanaColors.ink : ZanaColors.muted,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
