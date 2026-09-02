import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// ZANA brand palette — warm luxury tones for the Zambia beauty marketplace.
class ZanaColors {
  static const ink = Color(0xFF1C1917);
  static const muted = Color(0xFF78716C);
  static const cream = Color(0xFFFAF7F2);
  static const paper = Color(0xFFFFFFFF);
  static const copper = Color(0xFFB45309);
  static const gold = Color(0xFFD4A574);
  static const charcoal = Color(0xFF292524);
  static const espresso = Color(0xFF1A1512);
  static const blush = Color(0xFFF5EBE0);
  static const sage = Color(0xFF047857);
  static const sageLight = Color(0xFFECFDF5);

  static const heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF2C2420), Color(0xFF1A1512)],
  );

  static const surfaceGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFFF3EDE4), cream, cream],
    stops: [0, 0.22, 1],
  );
}

class ZanaDecorations {
  static BoxShadow cardShadow = BoxShadow(
    color: ZanaColors.espresso.withValues(alpha: 0.08),
    blurRadius: 24,
    offset: const Offset(0, 8),
  );

  static BoxShadow softShadow = BoxShadow(
    color: ZanaColors.espresso.withValues(alpha: 0.05),
    blurRadius: 16,
    offset: const Offset(0, 4),
  );

  static BoxDecoration premiumCard({double radius = 20}) => BoxDecoration(
        color: ZanaColors.paper,
        borderRadius: BorderRadius.circular(radius),
        boxShadow: [cardShadow],
        border: Border.all(
          color: ZanaColors.ink.withValues(alpha: 0.04),
        ),
      );

  static InputDecoration inputDecoration({
    required String hint,
    IconData? prefixIcon,
    Widget? suffix,
  }) =>
      InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: ZanaColors.muted.withValues(alpha: 0.85)),
        filled: true,
        fillColor: ZanaColors.paper,
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: ZanaColors.ink.withValues(alpha: 0.06)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: ZanaColors.copper, width: 1.5),
        ),
        prefixIcon: prefixIcon != null
            ? Icon(prefixIcon, color: ZanaColors.muted, size: 22)
            : null,
        suffixIcon: suffix,
      );
}

class ZanaText {
  static TextStyle display(BuildContext context) =>
      GoogleFonts.playfairDisplay(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.2,
        color: ZanaColors.gold,
        height: 1.1,
      );

  static TextStyle headline(BuildContext context) =>
      Theme.of(context).textTheme.headlineSmall!.copyWith(
            fontWeight: FontWeight.w800,
            color: ZanaColors.ink,
            letterSpacing: -0.3,
          );

  static TextStyle sectionTitle(BuildContext context) =>
      Theme.of(context).textTheme.titleMedium!.copyWith(
            fontWeight: FontWeight.w700,
            color: ZanaColors.ink,
            letterSpacing: -0.2,
          );

  static TextStyle subtitle(BuildContext context) =>
      Theme.of(context).textTheme.bodyMedium!.copyWith(
            color: ZanaColors.muted,
            height: 1.4,
          );

  static TextStyle overline(BuildContext context) => GoogleFonts.dmSans(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 1.8,
        color: ZanaColors.gold,
      );
}

ThemeData buildZanaTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: ZanaColors.copper,
      brightness: Brightness.light,
      surface: ZanaColors.cream,
      primary: ZanaColors.copper,
    ),
  );

  final body = GoogleFonts.dmSansTextTheme(base.textTheme);
  final display = GoogleFonts.playfairDisplayTextTheme(body);

  return base.copyWith(
    textTheme: body.copyWith(
      displaySmall: display.displaySmall?.copyWith(
        fontWeight: FontWeight.w700,
        color: ZanaColors.ink,
      ),
      headlineSmall: body.headlineSmall?.copyWith(
        fontWeight: FontWeight.w800,
        color: ZanaColors.ink,
      ),
      titleMedium: body.titleMedium?.copyWith(
        fontWeight: FontWeight.w700,
        color: ZanaColors.ink,
      ),
    ),
    scaffoldBackgroundColor: ZanaColors.cream,
    appBarTheme: AppBarTheme(
      backgroundColor: ZanaColors.cream,
      foregroundColor: ZanaColors.ink,
      elevation: 0,
      scrolledUnderElevation: 0,
      titleTextStyle: GoogleFonts.dmSans(
        fontSize: 17,
        fontWeight: FontWeight.w700,
        color: ZanaColors.ink,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: ZanaColors.espresso,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: GoogleFonts.dmSans(
          fontWeight: FontWeight.w700,
          fontSize: 15,
        ),
      ),
    ),
    cardTheme: CardThemeData(
      color: ZanaColors.paper,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
    ),
    dividerColor: ZanaColors.ink.withValues(alpha: 0.06),
  );
}
