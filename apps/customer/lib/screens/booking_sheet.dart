import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/home_pin_store.dart';
import 'package:zana_customer/theme.dart';

class BookingDraft {
  BookingDraft({
    required this.asap,
    this.scheduledAt,
    required this.address,
    this.lat,
    this.lng,
    this.notes,
    this.saveAsHome = false,
  });

  /// True = request right now (no scheduled slot). Online pro must accept.
  final bool asap;
  final DateTime? scheduledAt;
  final String address;
  final double? lat;
  final double? lng;
  final String? notes;
  final bool saveAsHome;
}

Future<BookingDraft?> showBookingSheet(
  BuildContext context, {
  required String serviceName,
  required String serviceMode,
  int? priceZmw,
  int? durationMin,
  bool preferAsap = false,
}) async {
  var asap = preferAsap;
  DateTime when = DateTime.now().add(const Duration(hours: 1));
  final addressCtrl = TextEditingController(
    text: serviceMode == 'COMES_TO_YOU' ? '' : 'At shop',
  );
  final notesCtrl = TextEditingController();
  double? lat;
  double? lng;
  String? error;
  var saveAsHome = false;
  var homeLoaded = false;
  HomePin? savedHome;

  if (serviceMode == 'COMES_TO_YOU') {
    savedHome = await HomePinStore.instance.load();
    if (savedHome != null) {
      addressCtrl.text = savedHome.address;
      lat = savedHome.lat;
      lng = savedHome.lng;
      homeLoaded = true;
    }
  }

  if (!context.mounted) return null;

  return showModalBottomSheet<BookingDraft>(
    context: context,
    isScrollControlled: true,
    backgroundColor: ZanaColors.paper,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (ctx) {
      return StatefulBuilder(
        builder: (ctx, setModal) {
          return Padding(
            padding: EdgeInsets.fromLTRB(
              22,
              14,
              22,
              22 + MediaQuery.of(ctx).viewInsets.bottom,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 14),
                      decoration: BoxDecoration(
                        color: ZanaColors.line,
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  Text(
                    'Book $serviceName',
                    style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    [
                      if (priceZmw != null) 'K$priceZmw',
                      if (durationMin != null) '$durationMin min',
                      serviceMode == 'COMES_TO_YOU'
                          ? 'Comes to you'
                          : 'At shop',
                    ].join(' · '),
                    style: const TextStyle(color: ZanaColors.muted),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _WhenChip(
                          label: 'Now',
                          subtitle: 'As soon as they accept',
                          selected: asap,
                          onTap: () => setModal(() => asap = true),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _WhenChip(
                          label: 'Schedule',
                          subtitle: 'Pick a time',
                          selected: !asap,
                          onTap: () => setModal(() => asap = false),
                        ),
                      ),
                    ],
                  ),
                  if (!asap) ...[
                    const SizedBox(height: 12),
                    Material(
                      color: ZanaColors.sand,
                      borderRadius: BorderRadius.circular(14),
                      child: ListTile(
                        title: const Text(
                          'When',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                        subtitle: Text(
                          DateFormat('EEE d MMM · HH:mm').format(when),
                        ),
                        trailing: const Icon(Icons.schedule_rounded),
                        onTap: () async {
                          final date = await showDatePicker(
                            context: ctx,
                            firstDate: DateTime.now(),
                            lastDate:
                                DateTime.now().add(const Duration(days: 60)),
                            initialDate: when,
                          );
                          if (date == null) return;
                          if (!ctx.mounted) return;
                          final time = await showTimePicker(
                            context: ctx,
                            initialTime: TimeOfDay.fromDateTime(when),
                          );
                          if (time == null) return;
                          setModal(() {
                            when = DateTime(
                              date.year,
                              date.month,
                              date.day,
                              time.hour,
                              time.minute,
                            );
                          });
                        },
                      ),
                    ),
                  ] else ...[
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Text(
                        'Nearby online pros can accept right away. You’ll see them move on the live map once they’re on the way.',
                        style: TextStyle(
                          color: Color(0xFF047857),
                          fontSize: 13,
                          height: 1.35,
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  TextField(
                    controller: addressCtrl,
                    decoration: InputDecoration(
                      labelText: serviceMode == 'COMES_TO_YOU'
                          ? 'Home / workplace address'
                          : 'Location note',
                    ),
                  ),
                  if (serviceMode == 'COMES_TO_YOU') ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        TextButton.icon(
                          onPressed: () async {
                            try {
                              final enabled =
                                  await Geolocator.isLocationServiceEnabled();
                              if (!enabled) {
                                setModal(
                                  () => error = 'Turn on location services',
                                );
                                return;
                              }
                              var perm = await Geolocator.checkPermission();
                              if (perm == LocationPermission.denied) {
                                perm = await Geolocator.requestPermission();
                              }
                              if (perm == LocationPermission.denied ||
                                  perm == LocationPermission.deniedForever) {
                                setModal(
                                  () => error = 'Location permission denied',
                                );
                                return;
                              }
                              final pos = await Geolocator.getCurrentPosition();
                              setModal(() {
                                lat = pos.latitude;
                                lng = pos.longitude;
                                if (addressCtrl.text.trim().isEmpty ||
                                    homeLoaded) {
                                  addressCtrl.text =
                                      'Pinned location ${pos.latitude.toStringAsFixed(4)}, ${pos.longitude.toStringAsFixed(4)}';
                                }
                                homeLoaded = false;
                                error = null;
                              });
                            } catch (e) {
                              setModal(() => error = e.toString());
                            }
                          },
                          icon: const Icon(Icons.my_location_rounded),
                          label: Text(
                            lat == null
                                ? 'Use my location'
                                : 'Location pinned',
                          ),
                        ),
                        if (savedHome != null)
                          TextButton.icon(
                            onPressed: () {
                              final home = savedHome!;
                              setModal(() {
                                addressCtrl.text = home.address;
                                lat = home.lat;
                                lng = home.lng;
                                homeLoaded = true;
                                error = null;
                              });
                            },
                            icon: const Icon(Icons.home_rounded),
                            label: const Text('Use saved home'),
                          ),
                      ],
                    ),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      value: saveAsHome,
                      activeColor: ZanaColors.copper,
                      onChanged: (v) =>
                          setModal(() => saveAsHome = v ?? false),
                      title: const Text(
                        'Save as my home pin',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      controlAffinity: ListTileControlAffinity.leading,
                    ),
                  ],
                  const SizedBox(height: 8),
                  TextField(
                    controller: notesCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Notes (optional)',
                    ),
                  ),
                  if (error != null) ...[
                    const SizedBox(height: 8),
                    Text(error!, style: const TextStyle(color: Colors.red)),
                  ],
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () async {
                        if (addressCtrl.text.trim().isEmpty) {
                          setModal(() => error = 'Add an address');
                          return;
                        }
                        final draft = BookingDraft(
                          asap: asap,
                          scheduledAt: asap ? null : when,
                          address: addressCtrl.text.trim(),
                          lat: lat,
                          lng: lng,
                          notes: notesCtrl.text.trim().isEmpty
                              ? null
                              : notesCtrl.text.trim(),
                          saveAsHome: saveAsHome,
                        );
                        if (saveAsHome &&
                            lat != null &&
                            lng != null &&
                            serviceMode == 'COMES_TO_YOU') {
                          await HomePinStore.instance.save(
                            HomePin(
                              lat: lat as double,
                              lng: lng as double,
                              address: addressCtrl.text.trim(),
                            ),
                          );
                          try {
                            await api.updateProfile(
                              homeLat: lat as double,
                              homeLng: lng as double,
                              homeAddress: addressCtrl.text.trim(),
                            );
                          } catch (_) {}
                        }
                        if (ctx.mounted) Navigator.of(ctx).pop(draft);
                      },
                      child: Text(asap ? 'Request now' : 'Confirm booking'),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      );
    },
  );
}

class _WhenChip extends StatelessWidget {
  const _WhenChip({
    required this.label,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? ZanaColors.ink : ZanaColors.sand,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  color: selected ? Colors.white : ZanaColors.ink,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 11,
                  color: selected
                      ? Colors.white.withValues(alpha: 0.75)
                      : ZanaColors.muted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
