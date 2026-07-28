import 'package:flutter/material.dart';
import 'package:zana_pro/api.dart';
import 'package:zana_pro/theme.dart';

Future<void> showBuyFloatSheet(
  BuildContext context, {
  required List<dynamic> packages,
  required Future<void> Function() onDone,
}) async {
  var method = 'MTN_MOMO';
  final phoneCtrl = TextEditingController(text: '+260');
  String? error;
  var busy = false;
  var simulate = true;
  String? pendingPurchaseId;
  String? pendingInstructions;

  await showModalBottomSheet<void>(
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
                  'Buy float',
                  style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Pay with MTN MoMo or Airtel Money',
                  style: TextStyle(color: ZanaColors.muted),
                ),
                const SizedBox(height: 14),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'MTN_MOMO', label: Text('MTN MoMo')),
                    ButtonSegment(value: 'AIRTEL_MONEY', label: Text('Airtel')),
                  ],
                  selected: {method},
                  onSelectionChanged: (s) => setModal(() => method = s.first),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Payer phone',
                    border: OutlineInputBorder(),
                  ),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Simulate instant success'),
                  subtitle: const Text('Off = PENDING until you confirm'),
                  value: simulate,
                  onChanged: (v) => setModal(() => simulate = v),
                ),
                if (pendingPurchaseId != null) ...[
                  Text(
                    pendingInstructions ?? 'Waiting for payment approval',
                    style: const TextStyle(color: ZanaColors.muted),
                  ),
                  const SizedBox(height: 8),
                  FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: ZanaColors.copper,
                    ),
                    onPressed: busy
                        ? null
                        : () async {
                            setModal(() => busy = true);
                            try {
                              await api.confirmPurchase(pendingPurchaseId!);
                              if (ctx.mounted) Navigator.of(ctx).pop();
                              await onDone();
                            } catch (e) {
                              setModal(() {
                                error = e.toString();
                                busy = false;
                              });
                            }
                          },
                    child: const Text('Confirm payment (webhook stub)'),
                  ),
                  const SizedBox(height: 12),
                ],
                ...packages.map((raw) {
                  final pkg = raw as Map<String, dynamic>;
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text('${pkg['name']} · ${pkg['credits']} credits'),
                    subtitle: Text('K${pkg['priceZmw']}'),
                    trailing: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: ZanaColors.charcoal,
                      ),
                      onPressed: busy
                          ? null
                          : () async {
                              setModal(() {
                                busy = true;
                                error = null;
                              });
                              try {
                                final res = await api.purchase(
                                  packageId: pkg['id'] as String,
                                  method: method,
                                  phone: phoneCtrl.text.trim(),
                                  simulate: simulate,
                                );
                                final pay = res['payment'] as Map?;
                                final status = pay?['status'] as String?;
                                if (status == 'PENDING') {
                                  final purchase =
                                      res['purchase'] as Map<String, dynamic>?;
                                  setModal(() {
                                    pendingPurchaseId =
                                        purchase?['id'] as String?;
                                    pendingInstructions =
                                        pay?['instructions'] as String?;
                                    busy = false;
                                  });
                                  return;
                                }
                                if (ctx.mounted) {
                                  Navigator.of(ctx).pop();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        pay?['instructions'] as String? ??
                                            'Float purchased. Credits: ${res['creditBalance']}',
                                      ),
                                    ),
                                  );
                                }
                                await onDone();
                              } catch (e) {
                                setModal(() {
                                  error = e.toString();
                                  busy = false;
                                });
                              }
                            },
                      child: const Text('Pay'),
                    ),
                  );
                }),
                if (error != null)
                  Text(error!, style: const TextStyle(color: Colors.red)),
              ],
            ),
          );
        },
      );
    },
  );
}
