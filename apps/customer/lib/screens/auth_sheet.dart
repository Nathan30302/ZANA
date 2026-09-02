import 'package:flutter/material.dart';
import 'package:zana_customer/api.dart';
import 'package:zana_customer/theme.dart';
import 'package:zana_customer/widgets/zana_ui.dart';

Future<bool> showAuthSheet(BuildContext context) async {
  final nameCtrl = TextEditingController();
  final phoneCtrl = TextEditingController(text: '+260');
  final codeCtrl = TextEditingController();
  var codeSent = false;
  String? error;

  final ok = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: ZanaColors.paper,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (ctx) {
      return StatefulBuilder(
        builder: (ctx, setModal) {
          return Padding(
            padding: EdgeInsets.fromLTRB(
              24,
              12,
              24,
              24 + MediaQuery.of(ctx).viewInsets.bottom,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const ZanaSheetHandle(),
                Text(
                  'Welcome to ZANA',
                  style: ZanaText.display(ctx).copyWith(fontSize: 26),
                ),
                const SizedBox(height: 6),
                Text(
                  'Sign in with your Zambian number — free for customers.',
                  style: ZanaText.subtitle(ctx),
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: nameCtrl,
                  textCapitalization: TextCapitalization.words,
                  decoration: ZanaDecorations.inputDecoration(
                    hint: 'Your name',
                    prefixIcon: Icons.person_outline_rounded,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: ZanaDecorations.inputDecoration(
                    hint: 'Phone (+260)',
                    prefixIcon: Icons.phone_outlined,
                  ),
                ),
                if (codeSent) ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: codeCtrl,
                    keyboardType: TextInputType.number,
                    decoration: ZanaDecorations.inputDecoration(
                      hint: 'OTP code (123456 in dev)',
                      prefixIcon: Icons.lock_outline_rounded,
                    ),
                  ),
                ],
                if (error != null) ...[
                  const SizedBox(height: 10),
                  Text(error!, style: const TextStyle(color: Colors.red)),
                ],
                const SizedBox(height: 20),
                Row(
                  children: [
                    OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 16,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        side: BorderSide(
                          color: ZanaColors.ink.withValues(alpha: 0.12),
                        ),
                      ),
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
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton(
                        onPressed: () async {
                          final name = nameCtrl.text.trim();
                          if (name.isEmpty) {
                            setModal(() => error = 'Enter your name');
                            return;
                          }
                          try {
                            await api.verifyOtp(
                              phoneCtrl.text.trim(),
                              codeCtrl.text.trim(),
                              name: name,
                            );
                            if (ctx.mounted) Navigator.of(ctx).pop(true);
                          } catch (e) {
                            setModal(() => error = e.toString());
                          }
                        },
                        child: const Text('Continue'),
                      ),
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
