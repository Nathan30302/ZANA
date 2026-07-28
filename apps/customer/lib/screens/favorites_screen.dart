import 'package:flutter/material.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/auth_sheet.dart';
import 'package:zana_customer/screens/provider_screen.dart';
import 'package:zana_customer/theme.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  Future<List<dynamic>>? future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (api.token == null) {
      final ok = await showAuthSheet(context);
      if (!ok) {
        setState(() => future = Future.value([]));
        return;
      }
    }
    setState(() => future = api.listFavorites());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Favorites')),
      body: future == null
          ? const Center(child: CircularProgressIndicator())
          : FutureBuilder<List<dynamic>>(
              future: future,
              builder: (context, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (api.token == null) {
                  return const Center(
                    child: Text(
                      'Sign in to save favorite pros.',
                      style: TextStyle(color: ZanaColors.muted),
                    ),
                  );
                }
                if (snap.hasError) {
                  return Center(child: Text('${snap.error}'));
                }
                final items = snap.data ?? [];
                if (items.isEmpty) {
                  return const Center(
                    child: Text(
                      'No favorites yet.\nTap ♥ on a pro to save them.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: ZanaColors.muted),
                    ),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, i) {
                    final fav = items[i] as Map<String, dynamic>;
                    final p = fav['provider'] as Map<String, dynamic>?;
                    if (p == null) return const SizedBox.shrink();
                    return Card(
                      color: ZanaColors.paper,
                      elevation: 0,
                      child: ListTile(
                        title: Text(p['displayName'] as String? ?? 'Pro'),
                        subtitle: Text('${p['area']} · ${p['type']}'),
                        trailing: IconButton(
                          icon: const Icon(Icons.favorite, color: ZanaColors.copper),
                          onPressed: () async {
                            await api.removeFavorite(p['id'] as String);
                            _load();
                          },
                        ),
                        onTap: () async {
                          await Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) =>
                                  ProviderScreen(providerId: p['id'] as String),
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
    );
  }
}
