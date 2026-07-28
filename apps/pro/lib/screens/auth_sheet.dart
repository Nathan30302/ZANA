import 'package:flutter/material.dart';
import 'package:zana_pro/api.dart';
import 'package:zana_pro/push.dart';
import 'package:zana_pro/theme.dart';

Future<bool> showProAuthSheet(BuildContext context) async {
  final nameCtrl = TextEditingController();
  final phoneCtrl = TextEditingController(text: '+260');
  final codeCtrl = TextEditingController();
  var codeSent = false;
  String? error;
  var busy = false;

  final ok = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: ZanaColors.paper,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (ctx) {
      return StatefulBuilder(
        builder: (ctx, setModal) {
          return Padding(
            padding: EdgeInsets.fromLTRB(
              22,
              14,
              22,
              22 + MediaQuery.of(ctx).viewInsets.bottom,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: ZanaColors.line,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
                const ZanaWordmark(markSize: 40, compact: true, pro: true),
                const SizedBox(height: 20),
                Text(
                  'Sign in to take jobs',
                  style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Approved pro phone · OTP. Stay online to get nearby requests.',
                  style: TextStyle(color: ZanaColors.muted, height: 1.35),
                ),
                const SizedBox(height: 18),
                TextField(
                  controller: nameCtrl,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(
                    labelText: 'Your name',
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone (+260)',
                  ),
                ),
                const SizedBox(height: 10),
                if (codeSent)
                  TextField(
                    controller: codeCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'OTP code',
                      hintText: '123456 in demo',
                    ),
                  ),
                if (error != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    error!,
                    style: TextStyle(color: Colors.red.shade700, fontSize: 13),
                  ),
                ],
                const SizedBox(height: 18),
                if (!codeSent)
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: busy
                          ? null
                          : () async {
                              setModal(() {
                                busy = true;
                                error = null;
                              });
                              try {
                                await api.requestOtp(phoneCtrl.text.trim());
                                setModal(() {
                                  codeSent = true;
                                  busy = false;
                                });
                              } catch (e) {
                                setModal(() {
                                  error = e.toString();
                                  busy = false;
                                });
                              }
                            },
                      child: Text(busy ? 'Sending…' : 'Send OTP'),
                    ),
                  )
                else
                  Row(
                    children: [
                      TextButton(
                        onPressed: busy
                            ? null
                            : () async {
                                try {
                                  await api.requestOtp(phoneCtrl.text.trim());
                                  setModal(() => error = null);
                                } catch (e) {
                                  setModal(() => error = e.toString());
                                }
                              },
                        child: const Text('Resend'),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: FilledButton(
                          style: FilledButton.styleFrom(
                            backgroundColor: ZanaColors.copper,
                          ),
                          onPressed: busy
                              ? null
                              : () async {
                                  final name = nameCtrl.text.trim();
                                  if (name.isEmpty) {
                                    setModal(() => error = 'Enter your name');
                                    return;
                                  }
                                  setModal(() {
                                    busy = true;
                                    error = null;
                                  });
                                  try {
                                    await api.verifyOtp(
                                      phoneCtrl.text.trim(),
                                      codeCtrl.text.trim(),
                                      name: name,
                                    );
                                    await registerPushTokenIfPossible();
                                    if (ctx.mounted) {
                                      Navigator.of(ctx).pop(true);
                                    }
                                  } catch (e) {
                                    setModal(() {
                                      error = e.toString();
                                      busy = false;
                                    });
                                  }
                                },
                          child: Text(busy ? '…' : 'Continue'),
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
