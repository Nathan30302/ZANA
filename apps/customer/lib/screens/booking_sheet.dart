import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';
import 'package:zana_customer/theme.dart';

class BookingDraft {
  BookingDraft({
    required this.scheduledAt,
    required this.address,
    this.lat,
    this.lng,
    this.notes,
  });

  final DateTime scheduledAt;
  final String address;
  final double? lat;
  final double? lng;
  final String? notes;
}

Future<BookingDraft?> showBookingSheet(
  BuildContext context, {
  required String serviceName,
  required String serviceMode,
}) async {
  DateTime when = DateTime.now().add(const Duration(hours: 1));
  final addressCtrl = TextEditingController(
    text: serviceMode == 'COMES_TO_YOU' ? '' : 'At shop',
  );
  final notesCtrl = TextEditingController();
  double? lat;
  double? lng;
  String? error;

  return showModalBottomSheet<BookingDraft>(
    context: context,
    isScrollControlled: true,
    backgroundColor: ZanaColors.paper,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) {
      return StatefulBuilder(
        builder: (ctx, setModal) {
          return Padding(
            padding: EdgeInsets.fromLTRB(
              20,
              20,
              20,
              20 + MediaQuery.of(ctx).viewInsets.bottom,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Book $serviceName',
                  style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 14),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('When'),
                  subtitle: Text(DateFormat('EEE d MMM · HH:mm').format(when)),
                  trailing: const Icon(Icons.schedule),
                  onTap: () async {
                    final date = await showDatePicker(
                      context: ctx,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 60)),
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
                TextField(
                  controller: addressCtrl,
                  decoration: InputDecoration(
                    labelText: serviceMode == 'COMES_TO_YOU'
                        ? 'Home / workplace address'
                        : 'Location note',
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 8),
                if (serviceMode == 'COMES_TO_YOU')
                  TextButton.icon(
                    onPressed: () async {
                      try {
                        final enabled = await Geolocator.isLocationServiceEnabled();
                        if (!enabled) {
                          setModal(() => error = 'Turn on location services');
                          return;
                        }
                        var perm = await Geolocator.checkPermission();
                        if (perm == LocationPermission.denied) {
                          perm = await Geolocator.requestPermission();
                        }
                        if (perm == LocationPermission.denied ||
                            perm == LocationPermission.deniedForever) {
                          setModal(() => error = 'Location permission denied');
                          return;
                        }
                        final pos = await Geolocator.getCurrentPosition();
                        setModal(() {
                          lat = pos.latitude;
                          lng = pos.longitude;
                          if (addressCtrl.text.trim().isEmpty) {
                            addressCtrl.text =
                                'Pinned location ${pos.latitude.toStringAsFixed(4)}, ${pos.longitude.toStringAsFixed(4)}';
                          }
                          error = null;
                        });
                      } catch (e) {
                        setModal(() => error = e.toString());
                      }
                    },
                    icon: const Icon(Icons.my_location),
                    label: Text(
                      lat == null ? 'Use my location' : 'Location pinned',
                    ),
                  ),
                TextField(
                  controller: notesCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Notes (optional)',
                    border: OutlineInputBorder(),
                  ),
                ),
                if (error != null) ...[
                  const SizedBox(height: 8),
                  Text(error!, style: const TextStyle(color: Colors.red)),
                ],
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: ZanaColors.charcoal,
                    ),
                    onPressed: () {
                      if (addressCtrl.text.trim().isEmpty) {
                        setModal(() => error = 'Add an address');
                        return;
                      }
                      Navigator.of(ctx).pop(
                        BookingDraft(
                          scheduledAt: when,
                          address: addressCtrl.text.trim(),
                          lat: lat,
                          lng: lng,
                          notes: notesCtrl.text.trim().isEmpty
                              ? null
                              : notesCtrl.text.trim(),
                        ),
                      );
                    },
                    child: const Text('Confirm booking'),
                  ),
                ),
              ],
            ),
          );
        },
      );
    },
  );
}
