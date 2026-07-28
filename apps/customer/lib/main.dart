import 'package:flutter/material.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/screens/shell_screen.dart';
import 'package:zana_customer/theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await api.restoreSession();
  runApp(const ZanaApp());
}

class ZanaApp extends StatelessWidget {
  const ZanaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ZANA',
      debugShowCheckedModeBanner: false,
      theme: buildZanaTheme(),
      home: const CustomerShell(),
    );
  }
}
