import 'package:flutter/material.dart';
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
    return MaterialApp(
      title: 'ZANA Pro',
      debugShowCheckedModeBanner: false,
      theme: buildZanaTheme(title: 'ZANA Pro'),
      home: const ProHomeScreen(),
    );
  }
}
