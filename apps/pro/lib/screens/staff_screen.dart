import 'package:flutter/material.dart';
import 'package:zana_pro/api.dart';
import 'package:zana_pro/theme.dart';

class StaffScreen extends StatefulWidget {
  const StaffScreen({super.key});

  @override
  State<StaffScreen> createState() => _StaffScreenState();
}

class _StaffScreenState extends State<StaffScreen> {
  Future<List<dynamic>>? future;
  final phoneCtrl = TextEditingController(text: '+260');
  final nameCtrl = TextEditingController();
  final titleCtrl = TextEditingController(text: 'Stylist');
  String? error;
  bool busy = false;

  @override
  void initState() {
    super.initState();
    future = api.listStaff();
  }

  @override
  void dispose() {
    phoneCtrl.dispose();
    nameCtrl.dispose();
    titleCtrl.dispose();
    super.dispose();
  }

  Future<void> _reload() async {
    setState(() => future = api.listStaff());
  }

  Future<void> _invite() async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await api.inviteStaff(
        phone: phoneCtrl.text.trim(),
        name: nameCtrl.text.trim().isEmpty ? null : nameCtrl.text.trim(),
        title: titleCtrl.text.trim(),
      );
      phoneCtrl.text = '+260';
      nameCtrl.clear();
      await _reload();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Staff invited — they share this shop float'),
          ),
        );
      }
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ZanaColors.cream,
      appBar: AppBar(
        title: const Text('Team'),
        backgroundColor: ZanaColors.cream,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Invite staff by phone. They share this shop’s float credits and can take jobs.',
            style: TextStyle(color: ZanaColors.muted, height: 1.4),
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: ZanaColors.paper,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: ZanaColors.ink.withValues(alpha: 0.05),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Invite',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Staff phone'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: nameCtrl,
                  decoration:
                      const InputDecoration(labelText: 'Name (optional)'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: titleCtrl,
                  decoration: const InputDecoration(labelText: 'Title'),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: ZanaColors.copper,
                    ),
                    onPressed: busy ? null : _invite,
                    child: Text(busy ? 'Inviting…' : 'Invite staff'),
                  ),
                ),
                if (error != null) ...[
                  const SizedBox(height: 8),
                  Text(error!, style: TextStyle(color: Colors.red.shade700)),
                ],
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Team',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
          ),
          const SizedBox(height: 10),
          FutureBuilder<List<dynamic>>(
            future: future,
            builder: (context, snap) {
              if (!snap.hasData) {
                return const Padding(
                  padding: EdgeInsets.all(12),
                  child: Center(
                    child: CircularProgressIndicator(color: ZanaColors.copper),
                  ),
                );
              }
              final items = snap.data!;
              if (items.isEmpty) {
                return Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: ZanaColors.paper.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Text(
                    'No staff yet.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: ZanaColors.muted),
                  ),
                );
              }
              return Column(
                children: items.map((raw) {
                  final m = raw as Map<String, dynamic>;
                  final user = m['user'] as Map<String, dynamic>?;
                  final name = user?['name'] as String? ??
                      user?['phone'] as String? ??
                      'Staff';
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
                    decoration: BoxDecoration(
                      color: ZanaColors.paper,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: ZanaColors.ink.withValues(alpha: 0.05),
                      ),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: ZanaColors.sand,
                          foregroundColor: ZanaColors.ink,
                          child: Text(
                            name.isNotEmpty ? name[0].toUpperCase() : 'S',
                            style: const TextStyle(fontWeight: FontWeight.w800),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              Text(
                                '${m['title'] ?? 'Staff'} · ${user?['phone'] ?? ''}',
                                style: const TextStyle(
                                  color: ZanaColors.muted,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          tooltip: 'Remove',
                          icon: const Icon(Icons.person_remove_outlined),
                          onPressed: () async {
                            await api.removeStaff(m['id'] as String);
                            _reload();
                          },
                        ),
                      ],
                    ),
                  );
                }).toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}
