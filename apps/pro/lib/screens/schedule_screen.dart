import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:zana_pro/api.dart';
import 'package:zana_pro/screens/job_detail_screen.dart';
import 'package:zana_pro/theme.dart';
import 'package:zana_pro/widgets.dart';

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  DateTime day = DateTime.now();
  Future<Map<String, dynamic>>? future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  String get _dateIso => DateFormat('yyyy-MM-dd').format(day);

  void _load() {
    setState(() {
      future = api.schedule(date: _dateIso);
    });
  }

  void _shift(int days) {
    day = day.add(Duration(days: days));
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final body = Column(
      children: [
        if (widget.embedded)
          const SafeArea(
            bottom: false,
            child: ProTabHeader(
              title: 'Schedule',
              subtitle: 'Accepted bookings with a time',
            ),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            decoration: BoxDecoration(
              color: ZanaColors.paper,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: ZanaColors.ink.withValues(alpha: 0.05),
              ),
            ),
            child: Row(
              children: [
                IconButton(
                  onPressed: () => _shift(-1),
                  icon: const Icon(Icons.chevron_left_rounded),
                ),
                Expanded(
                  child: Text(
                    DateFormat('EEE d MMM yyyy').format(day),
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
                IconButton(
                  onPressed: () => _shift(1),
                  icon: const Icon(Icons.chevron_right_rounded),
                ),
              ],
            ),
          ),
        ),
        Expanded(
          child: FutureBuilder<Map<String, dynamic>>(
            future: future,
            builder: (context, snap) {
              if (snap.connectionState == ConnectionState.waiting) {
                return const Center(
                  child: CircularProgressIndicator(color: ZanaColors.copper),
                );
              }
              if (snap.hasError) {
                return Center(child: Text('${snap.error}'));
              }
              final jobs = (snap.data?['jobs'] as List?) ?? [];
              if (jobs.isEmpty) {
                return const Center(
                  child: Padding(
                    padding: EdgeInsets.all(28),
                    child: Text(
                      'No scheduled jobs this day.\nAccepted bookings with a time show here.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: ZanaColors.muted, height: 1.4),
                    ),
                  ),
                );
              }
              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: jobs.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, i) {
                  final job = jobs[i] as Map<String, dynamic>;
                  final service = job['service'] as Map<String, dynamic>?;
                  final scheduled = job['scheduledAt'] != null
                      ? DateTime.tryParse(job['scheduledAt'] as String)
                      : null;
                  return Material(
                    color: ZanaColors.paper,
                    borderRadius: BorderRadius.circular(16),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () async {
                        await Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => JobDetailScreen(
                              bookingId: job['id'] as String,
                            ),
                          ),
                        );
                        _load();
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          children: [
                            Container(
                              width: 52,
                              height: 52,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: ZanaColors.sand,
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Text(
                                scheduled != null
                                    ? DateFormat('HH:mm')
                                        .format(scheduled.toLocal())
                                    : '—',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    service?['name'] as String? ?? 'Service',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    [
                                      '${job['status']}'.replaceAll('_', ' '),
                                      if (job['customerAddress'] != null)
                                        job['customerAddress'],
                                    ].join(' · '),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: ZanaColors.muted,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              'K${job['priceZmw']}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                color: ZanaColors.copper,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );

    if (widget.embedded) {
      return ColoredBox(color: ZanaColors.cream, child: body);
    }

    return Scaffold(
      backgroundColor: ZanaColors.cream,
      appBar: AppBar(
        title: const Text('Schedule'),
        backgroundColor: ZanaColors.cream,
      ),
      body: body,
    );
  }
}
