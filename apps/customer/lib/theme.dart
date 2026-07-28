import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// ZANA brand tokens — warm charcoal, copper, cream.
class ZanaColors {
  static const ink = Color(0xFF1C1917);
  static const muted = Color(0xFF57534E);
  static const cream = Color(0xFFFAF7F2);
  static const sand = Color(0xFFF3EDE4);
  static const paper = Color(0xFFFFFFFF);
  static const copper = Color(0xFFC2410C);
  static const copperBright = Color(0xFFD97706);
  static const copperSoft = Color(0xFFF59E0B);
  static const charcoal = Color(0xFF292524);
  static const line = Color(0xFFE7E5E4);
}

class ZanaBrand {
  static const name = 'ZANA';
  static const slogan = 'Style at your fingertips';
  static const tagline = 'Salons, barbers & mobile stylists — Lusaka first';
}

ThemeData buildZanaTheme({String title = 'ZANA'}) {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: ZanaColors.copper,
      brightness: Brightness.light,
      surface: ZanaColors.cream,
      primary: ZanaColors.charcoal,
      secondary: ZanaColors.copper,
    ),
  );

  final body = GoogleFonts.dmSansTextTheme(base.textTheme).apply(
    bodyColor: ZanaColors.ink,
    displayColor: ZanaColors.ink,
  );
  final display = GoogleFonts.syneTextTheme(body);

  return base.copyWith(
    textTheme: body.copyWith(
      displayLarge: display.displayLarge?.copyWith(fontWeight: FontWeight.w800),
      displayMedium: display.displayMedium?.copyWith(fontWeight: FontWeight.w800),
      displaySmall: display.displaySmall?.copyWith(fontWeight: FontWeight.w800),
      headlineLarge: display.headlineLarge?.copyWith(
        fontWeight: FontWeight.w800,
        letterSpacing: 1.2,
      ),
      headlineMedium: display.headlineMedium?.copyWith(
        fontWeight: FontWeight.w800,
        letterSpacing: 1.5,
      ),
      headlineSmall: display.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
      titleLarge: body.titleLarge?.copyWith(fontWeight: FontWeight.w700),
    ),
    scaffoldBackgroundColor: ZanaColors.cream,
    appBarTheme: const AppBarTheme(
      backgroundColor: ZanaColors.cream,
      foregroundColor: ZanaColors.ink,
      elevation: 0,
      centerTitle: false,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: ZanaColors.charcoal,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: ZanaColors.paper,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: ZanaColors.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: ZanaColors.ink.withValues(alpha: 0.08)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: ZanaColors.copper, width: 1.4),
      ),
    ),
  );
}

/// Exact ZANA scissors/comb mark (asset).
class ZanaMark extends StatelessWidget {
  const ZanaMark({super.key, this.size = 40, this.rounded = true});

  final double size;
  final bool rounded;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(rounded ? size * 0.18 : 0),
        child: Image.asset(
          'assets/brand/zana-logo.png',
          width: size,
          height: size,
          fit: BoxFit.contain,
          filterQuality: FilterQuality.high,
          errorBuilder: (_, __, ___) => CustomPaint(
            size: Size.square(size),
            painter: _ZanaMarkFallbackPainter(),
          ),
        ),
      ),
    );
  }
}

class _ZanaMarkFallbackPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final copper = Paint()..color = const Color(0xFFC2410C);
    final black = Paint()..color = const Color(0xFF111111);
    // Simple Z fallback if asset missing
    final top = Path()
      ..moveTo(size.width * 0.18, size.height * 0.22)
      ..lineTo(size.width * 0.82, size.height * 0.22)
      ..lineTo(size.width * 0.36, size.height * 0.62)
      ..lineTo(size.width * 0.18, size.height * 0.42)
      ..close();
    final bottom = Path()
      ..moveTo(size.width * 0.82, size.height * 0.38)
      ..lineTo(size.width * 0.82, size.height * 0.78)
      ..lineTo(size.width * 0.18, size.height * 0.78)
      ..lineTo(size.width * 0.64, size.height * 0.38)
      ..close();
    canvas.drawPath(top, copper);
    canvas.drawPath(bottom, black);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Wordmark + optional slogan for headers.
class ZanaWordmark extends StatelessWidget {
  const ZanaWordmark({
    super.key,
    this.showSlogan = true,
    this.markSize = 40,
    this.compact = false,
    this.pro = false,
    this.light = false,
  });

  final bool showSlogan;
  final double markSize;
  final bool compact;
  final bool pro;
  final bool light;

  @override
  Widget build(BuildContext context) {
    final titleColor = light ? Colors.white : ZanaColors.ink;
    final sloganColor = light
        ? Colors.white.withValues(alpha: 0.78)
        : ZanaColors.muted;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        ZanaMark(size: markSize),
        SizedBox(width: compact ? 10 : 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Text(
                    ZanaBrand.name,
                    style: GoogleFonts.syne(
                      fontSize: compact ? 22 : 26,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 2.4,
                      height: 1,
                      color: titleColor,
                    ),
                  ),
                  if (pro) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: light
                            ? Colors.white.withValues(alpha: 0.14)
                            : ZanaColors.copper.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        'PRO',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.2,
                          color: light ? Colors.white : ZanaColors.copper,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              if (showSlogan) ...[
                SizedBox(height: compact ? 3 : 5),
                Text(
                  ZanaBrand.slogan,
                  style: TextStyle(
                    fontSize: compact ? 12 : 13,
                    fontWeight: FontWeight.w500,
                    color: sloganColor,
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
