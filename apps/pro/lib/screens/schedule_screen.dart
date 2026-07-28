import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:zana_pro/api.dart';
import 'package:zana_pro/screens/job_detail_screen.dart';
import 'package:zana_pro/theme.dart';

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

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
    return Scaffold(
      appBar: AppBar(title: const Text('Schedule')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
            child: Row(
              children: [
                IconButton(onPressed: () => _shift(-1), icon: const Icon(Icons.chevron_left)),
                Expanded(
                  child: Text(
                    DateFormat('EEE d MMM yyyy').format(day),
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
                IconButton(onPressed: () => _shift(1), icon: const Icon(Icons.chevron_right)),
              ],
            ),
          ),
          Expanded(
            child: FutureBuilder<Map<String, dynamic>>(
              future: future,
              builder: (context, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snap.hasError) {
                  return Center(child: Text('${snap.error}'));
                }
                final jobs = (snap.data?['jobs'] as List?) ?? [];
                if (jobs.isEmpty) {
                  return const Center(
                    child: Text(
                      'No scheduled jobs this day.\nAccepted bookings with a time show here.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: ZanaColors.muted),
                    ),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: jobs.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, i) {
                    final job = jobs[i] as Map<String, dynamic>;
                    final service = job['service'] as Map<String, dynamic>?;
                    final scheduled = job['scheduledAt'] != null
                        ? DateTime.tryParse(job['scheduledAt'] as String)
                        : null;
                    return Card(
                      color: ZanaColors.paper,
                      elevation: 0,
                      child: ListTile(
                        title: Text(service?['name'] as String? ?? 'Service'),
                        subtitle: Text(
                          '${scheduled != null ? DateFormat('HH:mm').format(scheduled.toLocal()) : '—'}'
                          ' · ${job['status']}'
                          '${job['customerAddress'] != null ? '\n${job['customerAddress']}' : ''}',
                        ),
                        isThreeLine: job['customerAddress'] != null,
                        trailing: Text('K${job['priceZmw']}'),
                        onTap: () async {
                          await Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) =>
                                  JobDetailScreen(bookingId: job['id'] as String),
                            ),
                          );
                          _load();
                        },
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
