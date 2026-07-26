import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zana_customer/screens/home_screen.dart';
import 'package:zana_customer/theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ZanaApp());
}

class ZanaApp extends StatelessWidget {
  const ZanaApp({super.key});

  @override
  Widget build(BuildContext context) {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: ZanaColors.copper,
        brightness: Brightness.light,
        surface: ZanaColors.cream,
      ),
    );

    return MaterialApp(
      title: 'ZANA',
      debugShowCheckedModeBanner: false,
      theme: base.copyWith(
        textTheme: GoogleFonts.dmSansTextTheme(base.textTheme),
        scaffoldBackgroundColor: ZanaColors.cream,
        appBarTheme: const AppBarTheme(
          backgroundColor: ZanaColors.cream,
          foregroundColor: ZanaColors.ink,
          elevation: 0,
        ),
      ),
      home: const HomeScreen(),
    );
  }
}
