import 'package:flutter/material.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/provider_screen.dart';
import 'package:zana_customer/theme.dart';

const categories = ['ALL', 'BARBER', 'SALON', 'NAILS', 'BRIDAL', 'MOBILE'];

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String category = 'ALL';
  late Future<List<dynamic>> future;

  @override
  void initState() {
    super.initState();
    future = _load();
  }

  Future<List<dynamic>> _load() {
    return api.listProviders(
      category: category == 'ALL' ? null : category,
    );
  }

  void _reload(String next) {
    setState(() {
      category = next;
      future = _load();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'ZANA',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      letterSpacing: 2,
                      color: ZanaColors.copper,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                'Lusaka · find your next cut',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: ZanaColors.muted,
                    ),
              ),
              const SizedBox(height: 16),
              TextField(
                decoration: InputDecoration(
                  hintText: 'Search salons, barbers, stylists',
                  filled: true,
                  fillColor: ZanaColors.paper,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none,
                  ),
                  prefixIcon: const Icon(Icons.search),
                ),
                onSubmitted: (_) {},
              ),
              const SizedBox(height: 14),
              SizedBox(
                height: 40,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: categories.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, i) {
                    final c = categories[i];
                    final selected = c == category;
                    return ChoiceChip(
                      label: Text(c == 'ALL' ? 'Nearby' : c),
                      selected: selected,
                      onSelected: (_) => _reload(c),
                      selectedColor: ZanaColors.charcoal,
                      labelStyle: TextStyle(
                        color: selected ? Colors.white : ZanaColors.ink,
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: FutureBuilder<List<dynamic>>(
                  future: future,
                  builder: (context, snap) {
                    if (snap.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (snap.hasError) {
                      return Center(
                        child: Text(
                          'Could not reach API.\nStart apps/api on :3000\n${snap.error}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: ZanaColors.muted),
                        ),
                      );
                    }
                    final items = snap.data ?? [];
                    if (items.isEmpty) {
                      return const Center(child: Text('No providers yet. Seed the API.'));
                    }
                    return ListView.separated(
                      itemCount: items.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, i) {
                        final p = items[i] as Map<String, dynamic>;
                        return Material(
                          color: ZanaColors.paper,
                          borderRadius: BorderRadius.circular(16),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => ProviderScreen(providerId: p['id'] as String),
                                ),
                              );
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 28,
                                    backgroundColor: ZanaColors.cream,
                                    child: Text(
                                      (p['displayName'] as String).substring(0, 1),
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: ZanaColors.copper,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          p['displayName'] as String,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w700,
                                            fontSize: 16,
                                          ),
                                        ),
                                        Text(
                                          '${p['area']} · ${p['type']}',
                                          style: const TextStyle(color: ZanaColors.muted),
                                        ),
                                        Text(
                                          p['isOnline'] == true ? 'Online now' : 'Offline',
                                          style: TextStyle(
                                            color: p['isOnline'] == true
                                                ? Colors.green.shade700
                                                : ZanaColors.muted,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Text(
                                    '${(p['ratingAvg'] as num).toStringAsFixed(1)}★',
                                    style: const TextStyle(fontWeight: FontWeight.w600),
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
          ),
        ),
      ),
    );
  }
}
