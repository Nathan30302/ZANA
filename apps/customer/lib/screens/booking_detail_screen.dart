import 'package:flutter/material.dart';
import 'package:zana_customer/api.dart';
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

class BookingDetailScreen extends StatefulWidget {
  const BookingDetailScreen({super.key, required this.bookingId});

  final String bookingId;

  @override
  State<BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends State<BookingDetailScreen> {
  late Future<Map<String, dynamic>> future;
  int rating = 5;
  final commentCtrl = TextEditingController();
  bool busy = false;

  @override
  void initState() {
    super.initState();
    future = api.getBooking(widget.bookingId);
  }

  @override
  void dispose() {
    commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _reload() async {
    setState(() => future = api.getBooking(widget.bookingId));
  }

  Future<void> _cancel() async {
    setState(() => busy = true);
    try {
      await api.updateBookingStatus(widget.bookingId, 'CANCELLED');
      await _reload();
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
    return Scaffold(
      appBar: AppBar(title: const Text('Booking')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: future,
        builder: (context, snap) {
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final b = snap.data!;
          final status = b['status'] as String;
          final service = b['service'] as Map<String, dynamic>?;
          final provider = b['provider'] as Map<String, dynamic>?;
          final canCancel =
              status == 'REQUESTED' || status == 'ACCEPTED' || status == 'CONFIRMED';
          final canRate = status == 'COMPLETED';

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
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
              const SizedBox(height: 20),
              const Text('Status', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 10),
              ..._buildTimeline(status),
              if (status == 'CANCELLED' || status == 'DECLINED') ...[
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
              if (canRate) ...[
                const Text('Rate your experience',
                    style: TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Row(
                  children: List.generate(5, (i) {
                    final star = i + 1;
                    return IconButton(
                      onPressed: () => setState(() => rating = star),
                      icon: Icon(
                        star <= rating ? Icons.star : Icons.star_border,
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
                const SizedBox(height: 12),
                FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: ZanaColors.charcoal,
                  ),
                  onPressed: busy ? null : _rate,
                  child: const Text('Submit review'),
                ),
              ],
              if (b['review'] != null) ...[
                const SizedBox(height: 12),
                Text(
                  'You rated ${(b['review'] as Map)['rating']}★',
                  style: const TextStyle(color: ZanaColors.muted),
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
