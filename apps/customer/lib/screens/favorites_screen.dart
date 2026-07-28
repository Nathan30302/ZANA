import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/auth_sheet.dart';
import 'package:zana_customer/screens/provider_screen.dart';
import 'package:zana_customer/theme.dart';
import 'package:zana_customer/widgets.dart';

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
                return const Center(
                  child: CircularProgressIndicator(color: ZanaColors.copper),
                );
              }
              if (api.token == null) {
                return ZanaEmptyState(
                  icon: Icons.lock_outline_rounded,
                  title: 'Sign in to save',
                  body: 'Keep your favourite Lusaka stylists in one place.',
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
                return ZanaEmptyState(
                  icon: Icons.wifi_off_rounded,
                  title: 'Couldn’t load',
                  body: 'Check your connection and try again.',
                  actionLabel: 'Retry',
                  onAction: _load,
                );
              }
              final items = snap.data ?? [];
              if (items.isEmpty) {
                return const ZanaEmptyState(
                  icon: Icons.favorite_border_rounded,
                  title: 'No favourites yet',
                  body: 'Open a pro and tap the heart to save them here.',
                );
              }
              return ListView.separated(
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, i) {
                  final fav = items[i] as Map<String, dynamic>;
                  final p = fav['provider'] as Map<String, dynamic>?;
                  if (p == null) return const SizedBox.shrink();
                  return _FavoriteCard(
                    provider: p,
                    onOpen: () async {
                      await Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => ProviderScreen(
                            providerId: p['id'] as String,
                          ),
                        ),
                      );
                      _load();
                    },
                    onRemove: () async {
                      await api.removeFavorite(p['id'] as String);
                      _load();
                    },
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
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Saved',
                      style: GoogleFonts.syne(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: ZanaColors.ink,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
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
      backgroundColor: ZanaColors.cream,
      appBar: AppBar(title: const Text('Favorites'), backgroundColor: ZanaColors.cream),
      body: body,
    );
  }
}

class _FavoriteCard extends StatelessWidget {
  const _FavoriteCard({
    required this.provider,
    required this.onOpen,
    required this.onRemove,
  });

  final Map<String, dynamic> provider;
  final VoidCallback onOpen;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final name = provider['displayName'] as String? ?? 'Pro';
    final cover = provider['coverPhotoUrl'] as String?;
    final online = provider['isOnline'] == true;
    final rating = (provider['ratingAvg'] as num?)?.toDouble() ?? 0;
    final count = provider['ratingCount'] as int? ?? 0;

    return Material(
      color: ZanaColors.paper,
      borderRadius: BorderRadius.circular(18),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onOpen,
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: ZanaColors.ink.withValues(alpha: 0.05)),
          ),
          child: Row(
            children: [
              SizedBox(
                width: 96,
                height: 96,
                child: cover != null
                    ? Image.network(
                        cover,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                            const ColoredBox(color: ZanaColors.sand),
                      )
                    : const ColoredBox(color: ZanaColors.sand),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 12, 4, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${provider['area']} · ${provider['type']}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: ZanaColors.muted,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          ZanaStatusChip(
                            label: online ? 'Online' : 'Offline',
                            tone: online ? ZanaChipTone.ok : ZanaChipTone.neutral,
                          ),
                          if (count > 0) ...[
                            const SizedBox(width: 8),
                            Text(
                              '${rating.toStringAsFixed(1)}★',
                              style: const TextStyle(
                                color: ZanaColors.copper,
                                fontWeight: FontWeight.w700,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              IconButton(
                tooltip: 'Remove',
                onPressed: onRemove,
                icon: const Icon(Icons.favorite_rounded, color: ZanaColors.copper),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
