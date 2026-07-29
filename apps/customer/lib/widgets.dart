import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zana_customer/theme.dart';

/// Branded empty / gate state used across Discover-adjacent tabs.
class ZanaEmptyState extends StatelessWidget {
  const ZanaEmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.body,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String body;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(32, 24, 32, 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: ZanaColors.sand,
                borderRadius: BorderRadius.circular(22),
              ),
              child: Icon(icon, size: 34, color: ZanaColors.copper),
            ),
            const SizedBox(height: 18),
            Text(
              title,
              textAlign: TextAlign.center,
              style: GoogleFonts.syne(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: ZanaColors.ink,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              body,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: ZanaColors.muted,
                height: 1.4,
                fontSize: 14,
              ),
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 18),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: ZanaColors.copper,
                ),
                onPressed: onAction,
                child: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class ZanaStatusChip extends StatelessWidget {
  const ZanaStatusChip({super.key, required this.label, this.tone = ZanaChipTone.neutral});

  final String label;
  final ZanaChipTone tone;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (tone) {
      ZanaChipTone.copper => (
          ZanaColors.copper.withValues(alpha: 0.12),
          ZanaColors.copper,
        ),
      ZanaChipTone.ok => (
          const Color(0xFFECFDF5),
          const Color(0xFF047857),
        ),
      ZanaChipTone.danger => (
          const Color(0xFFFFF1F2),
          const Color(0xFFB91C1C),
        ),
      ZanaChipTone.neutral => (
          ZanaColors.sand,
          ZanaColors.muted,
        ),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontWeight: FontWeight.w800,
          fontSize: 11,
        ),
      ),
    );
  }
}

enum ZanaChipTone { copper, ok, danger, neutral }
