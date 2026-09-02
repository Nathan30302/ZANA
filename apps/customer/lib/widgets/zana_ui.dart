import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zana_customer/theme.dart';

/// Drag handle for premium bottom sheets.
class ZanaSheetHandle extends StatelessWidget {
  const ZanaSheetHandle({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 40,
        height: 4,
        margin: const EdgeInsets.only(bottom: 20),
        decoration: BoxDecoration(
          color: ZanaColors.ink.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(999),
        ),
      ),
    );
  }
}

/// Premium filter chip with optional icon.
class ZanaChip extends StatelessWidget {
  const ZanaChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
    this.icon,
    this.emphasis = false,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;
  final bool emphasis;

  @override
  Widget build(BuildContext context) {
    final bg = selected
        ? (emphasis ? ZanaColors.espresso : ZanaColors.copper)
        : ZanaColors.paper;
    final fg = selected ? Colors.white : ZanaColors.ink;

    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(999),
      elevation: selected ? 2 : 0,
      shadowColor: ZanaColors.copper.withValues(alpha: 0.3),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: selected
                ? null
                : Border.all(color: ZanaColors.ink.withValues(alpha: 0.08)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 16, color: fg),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: fg,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Empty state with icon and optional action.
class ZanaEmptyState extends StatelessWidget {
  const ZanaEmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: ZanaColors.blush,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(icon, size: 32, color: ZanaColors.copper),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              textAlign: TextAlign.center,
              style: ZanaText.headline(context).copyWith(fontSize: 20),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: ZanaText.subtitle(context),
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 24),
              FilledButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}

/// Shimmer placeholder while loading lists.
class ZanaShimmerList extends StatelessWidget {
  const ZanaShimmerList({super.key, this.count = 4});

  final int count;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      itemCount: count,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (_, __) => const _ShimmerCard(),
    );
  }
}

class _ShimmerCard extends StatefulWidget {
  const _ShimmerCard();

  @override
  State<_ShimmerCard> createState() => _ShimmerCardState();
}

class _ShimmerCardState extends State<_ShimmerCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (context, child) {
        final t = 0.55 + _ctrl.value * 0.25;
        return Opacity(opacity: t, child: child);
      },
      child: Container(
        height: 220,
        decoration: ZanaDecorations.premiumCard(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: ZanaColors.blush,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(20),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 14,
                    width: 140,
                    decoration: BoxDecoration(
                      color: ZanaColors.blush,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    height: 10,
                    width: 100,
                    decoration: BoxDecoration(
                      color: ZanaColors.blush.withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Screen header used across embedded tabs.
class ZanaScreenHeader extends StatelessWidget {
  const ZanaScreenHeader({
    super.key,
    required this.overline,
    required this.title,
    required this.subtitle,
    this.trailing,
  });

  final String overline;
  final String title;
  final String subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(overline, style: ZanaText.overline(context)),
                const SizedBox(height: 6),
                Text(title, style: ZanaText.display(context).copyWith(fontSize: 28)),
                const SizedBox(height: 4),
                Text(subtitle, style: ZanaText.subtitle(context)),
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

/// Premium provider card — vertical layout with image hero.
class ZanaProviderCard extends StatelessWidget {
  const ZanaProviderCard({
    super.key,
    required this.provider,
    required this.onTap,
  });

  final Map<String, dynamic> provider;
  final VoidCallback onTap;

  String _typeLabel(String? type) {
    switch (type) {
      case 'BARBERSHOP':
        return 'Barber';
      case 'SALON':
        return 'Salon';
      case 'MOBILE':
        return 'Mobile stylist';
      default:
        return type ?? 'Pro';
    }
  }

  @override
  Widget build(BuildContext context) {
    final cover = provider['coverPhotoUrl'] as String?;
    final rating = (provider['ratingAvg'] as num?)?.toDouble() ?? 0;
    final count = provider['ratingCount'] as int? ?? 0;
    final online = provider['isOnline'] == true;
    final name = provider['displayName'] as String? ?? 'Pro';
    final km = (provider['distanceKm'] as num?)?.toDouble();
    final area = provider['area'] as String? ?? '';

    return Material(
      color: Colors.transparent,
      clipBehavior: Clip.antiAlias,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Ink(
          decoration: ZanaDecorations.premiumCard(radius: 22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  AspectRatio(
                    aspectRatio: 16 / 10,
                    child: cover != null
                        ? Image.network(
                            cover,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) =>
                                _PlaceholderHero(name: name),
                          )
                        : _PlaceholderHero(name: name),
                  ),
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            ZanaColors.espresso.withValues(alpha: 0.55),
                          ],
                          stops: const [0.45, 1],
                        ),
                      ),
                    ),
                  ),
                  if (online)
                    Positioned(
                      top: 12,
                      left: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: ZanaColors.sageLight,
                          borderRadius: BorderRadius.circular(999),
                          boxShadow: [ZanaDecorations.softShadow],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: ZanaColors.sage,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Text(
                              'Available now',
                              style: TextStyle(
                                color: ZanaColors.sage,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  Positioned(
                    left: 16,
                    right: 16,
                    bottom: 14,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 20,
                                  letterSpacing: -0.3,
                                  shadows: [
                                    Shadow(
                                      blurRadius: 8,
                                      color: Colors.black26,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '$area · ${_typeLabel(provider['type'] as String?)}'
                                '${km != null ? ' · ${km.toStringAsFixed(1)} km' : ''}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.88),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.95),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            count > 0 ? '${rating.toStringAsFixed(1)} ★' : 'New',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                              color: count > 0
                                  ? ZanaColors.copper
                                  : ZanaColors.muted,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PlaceholderHero extends StatelessWidget {
  const _PlaceholderHero({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [ZanaColors.blush, Color(0xFFE8D5C4)],
        ),
      ),
      child: Center(
        child: Text(
          name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'Z',
          style: GoogleFonts.playfairDisplay(
            fontSize: 56,
            fontWeight: FontWeight.w700,
            color: ZanaColors.copper.withValues(alpha: 0.35),
          ),
        ),
      ),
    );
  }
}
