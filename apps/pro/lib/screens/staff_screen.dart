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
          const SnackBar(content: Text('Staff invited — they share this shop float')),
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
      appBar: AppBar(title: const Text('Team & float')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Invite staff by phone. They share this shop’s float credits and can take jobs.',
            style: TextStyle(color: ZanaColors.muted),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: phoneCtrl,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'Staff phone',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: nameCtrl,
            decoration: const InputDecoration(
              labelText: 'Name (optional)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: titleCtrl,
            decoration: const InputDecoration(
              labelText: 'Title',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: ZanaColors.charcoal),
            onPressed: busy ? null : _invite,
            child: const Text('Invite staff'),
          ),
          if (error != null) ...[
            const SizedBox(height: 8),
            Text(error!, style: const TextStyle(color: Colors.red)),
          ],
          const SizedBox(height: 24),
          const Text('Team', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
          const SizedBox(height: 8),
          FutureBuilder<List<dynamic>>(
            future: future,
            builder: (context, snap) {
              if (!snap.hasData) {
                return const Padding(
                  padding: EdgeInsets.all(12),
                  child: Center(child: CircularProgressIndicator()),
                );
              }
              final items = snap.data!;
              if (items.isEmpty) {
                return const Text(
                  'No staff yet.',
                  style: TextStyle(color: ZanaColors.muted),
                );
              }
              return Column(
                children: items.map((raw) {
                  final m = raw as Map<String, dynamic>;
                  final user = m['user'] as Map<String, dynamic>?;
                  return Card(
                    color: ZanaColors.paper,
                    elevation: 0,
                    child: ListTile(
                      title: Text(user?['name'] as String? ?? user?['phone'] as String? ?? 'Staff'),
                      subtitle: Text('${m['title'] ?? 'Staff'} · ${user?['phone']}'),
                      trailing: IconButton(
                        icon: const Icon(Icons.person_remove_outlined),
                        onPressed: () async {
                          await api.removeStaff(m['id'] as String);
                          _reload();
                        },
                      ),
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
