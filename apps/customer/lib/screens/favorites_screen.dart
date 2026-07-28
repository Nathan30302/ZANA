import 'package:flutter/material.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/auth_sheet.dart';
import 'package:zana_customer/screens/provider_screen.dart';
import 'package:zana_customer/theme.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key, this.embedded = false});

  final bool embedded;

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
      if (widget.embedded) {
        setState(() => future = Future.value([]));
        return;
      }
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
    final body = future == null
        ? const Center(child: CircularProgressIndicator())
        : FutureBuilder<List<dynamic>>(
            future: future,
            builder: (context, snap) {
              if (snap.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (api.token == null) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'Sign in to save favorite pros.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: ZanaColors.muted),
                        ),
                        if (widget.embedded) ...[
                          const SizedBox(height: 14),
                          FilledButton(
                            style: FilledButton.styleFrom(
                              backgroundColor: ZanaColors.charcoal,
                            ),
                            onPressed: () async {
                              final ok = await showAuthSheet(context);
                              if (ok) _load();
                            },
                            child: const Text('Sign in'),
                          ),
                        ],
                      ],
                    ),
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
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, i) {
                  final fav = items[i] as Map<String, dynamic>;
                  final p = fav['provider'] as Map<String, dynamic>?;
                  if (p == null) return const SizedBox.shrink();
                  return Material(
                    color: ZanaColors.paper,
                    borderRadius: BorderRadius.circular(14),
                    child: ListTile(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      title: Text(
                        p['displayName'] as String? ?? 'Pro',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text('${p['area']} · ${p['type']}'),
                      trailing: IconButton(
                        icon: const Icon(
                          Icons.favorite,
                          color: ZanaColors.copper,
                        ),
                        onPressed: () async {
                          await api.removeFavorite(p['id'] as String);
                          _load();
                        },
                      ),
                      onTap: () async {
                        await Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => ProviderScreen(
                              providerId: p['id'] as String,
                            ),
                          ),
                        );
                        _load();
                      },
                    ),
                  );
                },
              );
            },
          );

    if (widget.embedded) {
      return ColoredBox(
        color: ZanaColors.cream,
        child: SafeArea(
          bottom: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Saved',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: ZanaColors.ink,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Pros you love in Lusaka',
                      style: TextStyle(color: ZanaColors.muted),
                    ),
                  ],
                ),
              ),
              Expanded(child: body),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Favorites')),
      body: body,
    );
  }
}
