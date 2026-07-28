import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zana_pro/api.dart';
import 'package:zana_pro/screens/pro_home.dart';
import 'package:zana_pro/theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await api.restoreSession();
  runApp(const ZanaProApp());
}

class ZanaProApp extends StatelessWidget {
  const ZanaProApp({super.key});

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
      title: 'ZANA Pro',
      debugShowCheckedModeBanner: false,
      theme: base.copyWith(
        textTheme: GoogleFonts.dmSansTextTheme(base.textTheme),
        scaffoldBackgroundColor: ZanaColors.cream,
      ),
      home: const ProHomeScreen(),
    );
  }
}
