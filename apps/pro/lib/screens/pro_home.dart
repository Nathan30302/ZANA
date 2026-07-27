import 'package:flutter/material.dart';
import 'package:zana_pro/api.dart';
import 'package:zana_pro/screens/buy_float_sheet.dart';
import 'package:zana_pro/theme.dart';


class ProHomeScreen extends StatefulWidget {
  const ProHomeScreen({super.key});

  @override
  State<ProHomeScreen> createState() => _ProHomeScreenState();
}

class _ProHomeScreenState extends State<ProHomeScreen> {
  bool loading = true;
  bool online = false;
  int credits = 0;
  List<dynamic> jobs = [];
  List<dynamic> packages = [];
  String? error;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      await api.loginAsSeedProvider();
      final bal = await api.balance();
      final j = await api.jobs();
      final p = await api.packages();
      setState(() {
        credits = bal['creditBalance'] as int? ?? 0;
        jobs = j;
        packages = p;
        loading = false;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        loading = false;
      });
    }
  }

  Future<void> _toggle(bool value) async {
    final profile = await api.setOnline(value);
    setState(() => online = profile['isOnline'] as bool? ?? value);
  }

  Future<void> _openBuyFloat() async {
    await showBuyFloatSheet(
      context,
      packages: packages,
      onDone: _bootstrap,
    );
  }

  Future<void> _accept(String id) async {
    await api.updateStatus(id, 'ACCEPTED');
    await _bootstrap();
  }

  Future<void> _advance(String id, String status) async {
    await api.updateStatus(id, status);
    await _bootstrap();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: loading
            ? const Center(child: CircularProgressIndicator())
            : error != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        'API offline or seed missing.\n$error',
                        textAlign: TextAlign.center,
                      ),
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _bootstrap,
                    child: ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        Text(
                          'ZANA Pro',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: ZanaColors.copper,
                              ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: ZanaColors.paper,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Go Online', style: TextStyle(fontWeight: FontWeight.w700)),
                                    Text(
                                      online ? 'Accepting jobs' : 'Offline',
                                      style: const TextStyle(color: ZanaColors.muted),
                                    ),
                                  ],
                                ),
                              ),
                              Switch(value: online, onChanged: _toggle),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: ZanaColors.charcoal,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Float credits', style: TextStyle(color: Colors.white70)),
                                    Text(
                                      '$credits',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 32,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (packages.isNotEmpty)
                                TextButton(
                                  onPressed: _openBuyFloat,
                                  style: TextButton.styleFrom(foregroundColor: ZanaColors.copper),
                                  child: const Text('Buy float'),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                        const Text('Incoming jobs', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
                        const SizedBox(height: 8),
                        if (jobs.isEmpty)
                          const Text('No jobs yet.', style: TextStyle(color: ZanaColors.muted)),
                        ...jobs.map((raw) {
                          final job = raw as Map<String, dynamic>;
                          final service = job['service'] as Map<String, dynamic>?;
                          final status = job['status'] as String;
                          Widget? action;
                          if (status == 'REQUESTED') {
                            action = TextButton(
                              onPressed: () => _accept(job['id'] as String),
                              child: const Text('Accept'),
                            );
                          } else if (status == 'ACCEPTED' || status == 'CONFIRMED') {
                            action = TextButton(
                              onPressed: () => _advance(job['id'] as String, 'ON_THE_WAY'),
                              child: const Text('On the way'),
                            );
                          } else if (status == 'ON_THE_WAY') {
                            action = TextButton(
                              onPressed: () => _advance(job['id'] as String, 'IN_SERVICE'),
                              child: const Text('Start'),
                            );
                          } else if (status == 'IN_SERVICE') {
                            action = TextButton(
                              onPressed: () => _advance(job['id'] as String, 'COMPLETED'),
                              child: const Text('Complete'),
                            );
                          }
                          return Card(
                            color: ZanaColors.paper,
                            elevation: 0,
                            child: ListTile(
                              title: Text(service?['name'] as String? ?? 'Service'),
                              subtitle: Text('Status: $status · K${job['priceZmw']}'),
                              trailing: action,
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
      ),
    );
  }
}
