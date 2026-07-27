import 'package:flutter/material.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/theme.dart';

Future<bool> showAuthSheet(BuildContext context) async {
  final phoneCtrl = TextEditingController(text: '+260');
  final codeCtrl = TextEditingController();
  var codeSent = false;
  String? error;

  final ok = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: ZanaColors.paper,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) {
      return StatefulBuilder(
        builder: (ctx, setModal) {
          return Padding(
            padding: EdgeInsets.fromLTRB(
              20,
              20,
              20,
              20 + MediaQuery.of(ctx).viewInsets.bottom,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Sign in to book',
                  style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Zambian phone OTP · free customer account',
                  style: TextStyle(color: ZanaColors.muted),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone (+260)',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                if (codeSent)
                  TextField(
                    controller: codeCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'OTP code',
                      hintText: '123456 in dev',
                      border: OutlineInputBorder(),
                    ),
                  ),
                if (error != null) ...[
                  const SizedBox(height: 8),
                  Text(error!, style: const TextStyle(color: Colors.red)),
                ],
                const SizedBox(height: 14),
                Row(
                  children: [
                    TextButton(
                      onPressed: () async {
                        try {
                          await api.requestOtp(phoneCtrl.text.trim());
                          setModal(() {
                            codeSent = true;
                            error = null;
                          });
                        } catch (e) {
                          setModal(() => error = e.toString());
                        }
                      },
                      child: const Text('Send OTP'),
                    ),
                    const Spacer(),
                    FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: ZanaColors.charcoal,
                      ),
                      onPressed: () async {
                        try {
                          await api.verifyOtp(
                            phoneCtrl.text.trim(),
                            codeCtrl.text.trim(),
                          );
                          try {
                            await api.registerFcmToken(
                              'customer-dev-fcm-${DateTime.now().millisecondsSinceEpoch}',
                            );
                          } catch (_) {}
                          if (ctx.mounted) Navigator.of(ctx).pop(true);
                        } catch (e) {
                          setModal(() => error = e.toString());
                        }
                      },
                      child: const Text('Continue'),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      );
    },
  );

  return ok == true;
}
