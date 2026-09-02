import 'package:flutter/material.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/auth_sheet.dart';
import 'package:zana_customer/screens/provider_screen.dart';
import 'package:zana_customer/theme.dart';
import 'package:zana_customer/widgets/zana_ui.dart';

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
        ? const Center(
            child: CircularProgressIndicator(color: ZanaColors.copper),
          )
        : FutureBuilder<List<dynamic>>(
            future: future,
            builder: (context, snap) {
              if (snap.connectionState == ConnectionState.waiting) {
                return const ZanaShimmerList(count: 3);
              }
              if (api.token == null) {
                return ZanaEmptyState(
                  icon: Icons.bookmark_outline_rounded,
                  title: 'Save your favourites',
                  subtitle: 'Sign in to keep track of pros you love.',
                  actionLabel: widget.embedded ? 'Sign in' : null,
                  onAction: widget.embedded
                      ? () async {
                          final ok = await showAuthSheet(context);
                          if (ok) _load();
                        }
                      : null,
                );
              }
              if (snap.hasError) {
                return Center(child: Text('${snap.error}'));
              }
              final items = snap.data ?? [];
              if (items.isEmpty) {
                return ZanaEmptyState(
                  icon: Icons.favorite_border_rounded,
                  title: 'No saved pros yet',
                  subtitle: 'Tap the heart on any pro to save them here.',
                );
              }
              return ListView.separated(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, i) {
                  final fav = items[i] as Map<String, dynamic>;
                  final p = fav['provider'] as Map<String, dynamic>?;
                  if (p == null) return const SizedBox.shrink();
                  return ZanaProviderCard(
                    provider: p,
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
                  );
                },
              );
            },
          );

    if (widget.embedded) {
      return DecoratedBox(
        decoration: const BoxDecoration(gradient: ZanaColors.surfaceGradient),
        child: SafeArea(
          bottom: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const ZanaScreenHeader(
                overline: 'YOUR COLLECTION',
                title: 'Saved',
                subtitle: 'Pros you love across Lusaka',
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
