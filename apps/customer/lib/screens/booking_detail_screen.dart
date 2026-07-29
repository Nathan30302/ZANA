import 'dart:async';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/book_now_sheet.dart';
import 'package:zana_customer/screens/provider_screen.dart';
import 'package:zana_customer/screens/tracking_screen.dart';
import 'package:zana_customer/theme.dart';

const _timeline = [
  'REQUESTED',
  'ACCEPTED',
  'ON_THE_WAY',
  'CONFIRMED',
  'IN_SERVICE',
  'COMPLETED',
  'RATED',
];

const _terminalStatuses = {
  'COMPLETED',
  'RATED',
  'CANCELLED',
  'DECLINED',
  'EXPIRED',
};

class BookingDetailScreen extends StatefulWidget {
  const BookingDetailScreen({super.key, required this.bookingId});

  final String bookingId;

  @override
  State<BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends State<BookingDetailScreen> {
  Map<String, dynamic>? booking;
  String? loadError;
  int rating = 5;
  final commentCtrl = TextEditingController();
  String? reviewPhotoUrl;
  bool busy = false;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _reload();
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) => _poll());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    commentCtrl.dispose();
    super.dispose();
  }

  bool _isTerminal(String? status) =>
      status != null && _terminalStatuses.contains(status);

  Future<void> _reload() async {
    try {
      final b = await api.getBooking(widget.bookingId);
      if (!mounted) return;
      setState(() {
        booking = b;
        loadError = null;
      });
      if (_isTerminal(b['status'] as String?)) {
        _pollTimer?.cancel();
        _pollTimer = null;
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => loadError = e.toString());
    }
  }

  Future<void> _poll() async {
    if (_isTerminal(booking?['status'] as String?)) {
      _pollTimer?.cancel();
      _pollTimer = null;
      return;
    }
    await _reload();
  }

  Future<void> _cancel() async {
    final reasonCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel booking'),
        content: TextField(
          controller: reasonCtrl,
          decoration: const InputDecoration(
            labelText: 'Reason',
            border: OutlineInputBorder(),
          ),
          maxLines: 2,
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Back')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Cancel booking'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => busy = true);
    try {
      await api.updateBookingStatus(
        widget.bookingId,
        'CANCELLED',
        cancelReason: reasonCtrl.text.trim(),
      );
      await _reload();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _dispute() async {
    final noteCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Report an issue'),
        content: TextField(
          controller: noteCtrl,
          decoration: const InputDecoration(
            labelText: 'What went wrong?',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Back')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Submit'),
          ),
        ],
      ),
    );
    if (ok != true || noteCtrl.text.trim().isEmpty) return;
    setState(() => busy = true);
    try {
      await api.reportDispute(widget.bookingId, noteCtrl.text.trim());
      await _reload();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _pickReviewPhoto() async {
    final file = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (file == null) return;
    setState(() => busy = true);
    try {
      final urls = await api.uploadImages([file.path]);
      setState(() => reviewPhotoUrl = urls.first);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _rate() async {
    setState(() => busy = true);
    try {
      await api.submitReview(
        bookingId: widget.bookingId,
        rating: rating,
        comment: commentCtrl.text.trim(),
        photoUrl: reviewPhotoUrl,
      );
      await _reload();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = booking;
    return Scaffold(
      appBar: AppBar(title: const Text('Booking')),
      body: b == null
          ? Center(
              child: loadError != null
                  ? Text(loadError!)
                  : const CircularProgressIndicator(),
            )
          : Builder(
              builder: (context) {
                final status = b['status'] as String;
                final service = b['service'] as Map<String, dynamic>?;
                final provider = b['provider'] as Map<String, dynamic>?;
                final canCancel = status == 'REQUESTED' ||
                    status == 'ACCEPTED' ||
                    status == 'CONFIRMED' ||
                    status == 'ON_THE_WAY' ||
                    status == 'IN_SERVICE';
                final canDispute = status != 'REQUESTED';
                final canRate = status == 'COMPLETED';
                final canTrack = status == 'ON_THE_WAY' ||
                    status == 'IN_SERVICE' ||
                    status == 'ACCEPTED' ||
                    status == 'CONFIRMED' ||
                    status == 'REQUESTED';
                final isAsap = b['scheduledAt'] == null;
                final canRebook = status == 'COMPLETED' ||
                    status == 'RATED' ||
                    status == 'CANCELLED' ||
                    status == 'DECLINED' ||
                    status == 'EXPIRED';
                final scheduled = b['scheduledAt'] != null
                    ? DateTime.tryParse(b['scheduledAt'] as String)
                    : null;
                final assigned = b['assignedStaff'] as Map<String, dynamic>?;
                final hasReview = b['review'] != null;

                return ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    if (canTrack) ...[
                      Material(
                        color: ZanaColors.ink,
                        borderRadius: BorderRadius.circular(18),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(18),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => TrackingScreen(
                                  bookingId: widget.bookingId,
                                  openReviewWhenDone: true,
                                ),
                              ),
                            );
                          },
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
                            child: Row(
                              children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: ZanaColors.copper,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(
                                    Icons.map_rounded,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        status == 'REQUESTED'
                                            ? 'Waiting on live map'
                                            : 'Live map & status',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 16,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        isAsap
                                            ? 'See who’s coming and how far they are'
                                            : 'Track your booking in real time',
                                        style: const TextStyle(
                                          color: Color(0xFFD6D3D1),
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const Icon(
                                  Icons.arrow_forward_rounded,
                                  color: Colors.white,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                    ],
                    Text(
                      service?['name'] as String? ?? 'Service',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${provider?['displayName'] ?? 'Pro'} · K${b['priceZmw']}',
                      style: const TextStyle(color: ZanaColors.muted),
                    ),
                    if (assigned != null)
                      Text(
                        'Stylist: ${assigned['name'] ?? assigned['phone']}',
                        style: const TextStyle(color: ZanaColors.muted),
                      ),
                    if (isAsap)
                      const Text(
                        'When: As soon as accepted',
                        style: TextStyle(
                          color: ZanaColors.copper,
                          fontWeight: FontWeight.w700,
                        ),
                      )
                    else if (scheduled != null)
                      Text(
                        'When: ${DateFormat('EEE d MMM · HH:mm').format(scheduled.toLocal())}',
                        style: const TextStyle(color: ZanaColors.muted),
                      ),
                    if (b['customerAddress'] != null)
                      Text(
                        'Where: ${b['customerAddress']}',
                        style: const TextStyle(color: ZanaColors.muted),
                      ),
                    if (b['contactPhone'] != null)
                      Text(
                        'Contact: ${b['contactPhone']}',
                        style: const TextStyle(color: ZanaColors.muted),
                      ),
                    if (b['declineReason'] != null)
                      Text(
                        'Declined: ${b['declineReason']}',
                        style: TextStyle(color: Colors.red.shade700),
                      ),
                    if (b['cancelReason'] != null)
                      Text(
                        'Cancelled: ${b['cancelReason']}',
                        style: TextStyle(color: Colors.red.shade700),
                      ),
                    if (b['disputeNote'] != null)
                      Text(
                        'Dispute: ${b['disputeNote']}',
                        style: const TextStyle(color: ZanaColors.muted),
                      ),
                    const SizedBox(height: 20),
                    const Text('Status',
                        style: TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 10),
                    ..._buildTimeline(status),
                    if (status == 'CANCELLED' ||
                        status == 'DECLINED' ||
                        status == 'EXPIRED') ...[
                      const SizedBox(height: 8),
                      Text(
                        status,
                        style: TextStyle(
                          color: Colors.red.shade700,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    if (canCancel)
                      OutlinedButton(
                        onPressed: busy ? null : _cancel,
                        child: const Text('Cancel booking'),
                      ),
                    if (canDispute) ...[
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: busy ? null : _dispute,
                        child: const Text('Report an issue'),
                      ),
                    ],
                    if (canRebook && provider?['id'] != null) ...[
                      const SizedBox(height: 8),
                      OutlinedButton.icon(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => ProviderScreen(
                                providerId: provider!['id'] as String,
                              ),
                            ),
                          );
                        },
                        icon: const Icon(Icons.replay),
                        label: const Text('Book again'),
                      ),
                      if (status == 'EXPIRED' ||
                          status == 'DECLINED' ||
                          status == 'CANCELLED') ...[
                        const SizedBox(height: 8),
                        FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: ZanaColors.copper,
                          ),
                          onPressed: () async {
                            final lat = (b['customerLat'] as num?)?.toDouble() ??
                                ZanaApi.lusakaLat;
                            final lng = (b['customerLng'] as num?)?.toDouble() ??
                                ZanaApi.lusakaLng;
                            await showBookNowFlow(
                              context,
                              userLat: lat,
                              userLng: lng,
                              excludeProviderId: provider!['id'] as String?,
                            );
                          },
                          icon: const Icon(Icons.explore_rounded),
                          label: const Text('Try someone else'),
                        ),
                      ],
                    ],
                    if (canRate && !hasReview) ...[
                      const SizedBox(height: 16),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: ZanaColors.sand,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'How was it?',
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 18,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Your review helps the next customer pick a great stylist.',
                              style: TextStyle(
                                color: ZanaColors.muted,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: List.generate(5, (i) {
                                final star = i + 1;
                                return IconButton(
                                  onPressed: () => setState(() => rating = star),
                                  icon: Icon(
                                    star <= rating
                                        ? Icons.star
                                        : Icons.star_border,
                                    color: ZanaColors.copper,
                                  ),
                                );
                              }),
                            ),
                            TextField(
                              controller: commentCtrl,
                              maxLines: 3,
                              decoration: const InputDecoration(
                                hintText: 'Optional comment',
                                border: OutlineInputBorder(),
                              ),
                            ),
                            const SizedBox(height: 8),
                            OutlinedButton.icon(
                              onPressed: busy ? null : _pickReviewPhoto,
                              icon: const Icon(Icons.photo_camera_outlined),
                              label: Text(reviewPhotoUrl == null
                                  ? 'Add photo'
                                  : 'Photo attached'),
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              width: double.infinity,
                              child: FilledButton(
                                style: FilledButton.styleFrom(
                                  backgroundColor: ZanaColors.copper,
                                ),
                                onPressed: busy ? null : _rate,
                                child: const Text('Submit review'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    if (hasReview) ...[
                      const SizedBox(height: 12),
                      Text(
                        'You rated ${(b['review'] as Map)['rating']}★',
                        style: const TextStyle(color: ZanaColors.muted),
                      ),
                      if ((b['review'] as Map)['photoUrl'] != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.network(
                              (b['review'] as Map)['photoUrl'] as String,
                              height: 140,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) =>
                                  const SizedBox.shrink(),
                            ),
                          ),
                        ),
                    ],
                  ],
                );
              },
            ),
    );
  }

  List<Widget> _buildTimeline(String status) {
    final terminal = status == 'CANCELLED' || status == 'DECLINED' || status == 'EXPIRED';
    if (terminal) {
      return [
        _step(status, done: true, current: true),
      ];
    }
    final idx = _timeline.indexOf(status);
    return [
      for (var i = 0; i < _timeline.length; i++)
        _step(
          _timeline[i],
          done: i <= idx,
          current: i == idx,
        ),
    ];
  }

  Widget _step(String label, {required bool done, required bool current}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(
            done ? Icons.check_circle : Icons.radio_button_unchecked,
            size: 20,
            color: current
                ? ZanaColors.copper
                : done
                    ? ZanaColors.charcoal
                    : ZanaColors.muted,
          ),
          const SizedBox(width: 10),
          Text(
            label.replaceAll('_', ' '),
            style: TextStyle(
              fontWeight: current ? FontWeight.w700 : FontWeight.w400,
              color: done || current ? ZanaColors.ink : ZanaColors.muted,
            ),
          ),
        ],
      ),
    );
  }
}
