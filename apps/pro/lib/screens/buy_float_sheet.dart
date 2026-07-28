import 'dart:async';

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
  // Simulate only in debug/dev builds unless overridden.
  var simulate = const bool.fromEnvironment('dart.vm.product') == false;
  String? pendingPurchaseId;
  String? pendingInstructions;
  Timer? pollTimer;

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: ZanaColors.paper,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (ctx) {
      return StatefulBuilder(
        builder: (ctx, setModal) {
          Future<void> confirmPending() async {
            if (pendingPurchaseId == null) return;
            setModal(() => busy = true);
            try {
              final res = await api.confirmPurchase(pendingPurchaseId!);
              final status =
                  (res['payment'] as Map?)?['status'] as String? ??
                      (res['purchase'] as Map?)?['status'] as String?;
              if (status == 'PENDING') {
                setModal(() {
                  busy = false;
                  pendingInstructions =
                      'Still waiting for MoMo/Airtel approval…';
                });
                return;
              }
              if (status == 'FAILED') {
                setModal(() {
                  busy = false;
                  error = 'Payment failed or was cancelled';
                  pendingPurchaseId = null;
                });
                pollTimer?.cancel();
                return;
              }
              pollTimer?.cancel();
              if (ctx.mounted) Navigator.of(ctx).pop();
              await onDone();
            } catch (e) {
              setModal(() {
                error = e.toString();
                busy = false;
              });
            }
          }

          void startPolling() {
            pollTimer?.cancel();
            pollTimer = Timer.periodic(const Duration(seconds: 4), (_) {
              confirmPending();
            });
          }

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
                    margin: const EdgeInsets.only(bottom: 14),
                    decoration: BoxDecoration(
                      color: ZanaColors.line,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
                Text(
                  'Buy float',
                  style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Credits let you accept jobs. Pay with MTN MoMo or Airtel Money.',
                  style: TextStyle(color: ZanaColors.muted, height: 1.35),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _PayMethodChip(
                        label: 'MTN MoMo',
                        selected: method == 'MTN_MOMO',
                        onTap: () => setModal(() => method = 'MTN_MOMO'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _PayMethodChip(
                        label: 'Airtel',
                        selected: method == 'AIRTEL_MONEY',
                        onTap: () => setModal(() => method = 'AIRTEL_MONEY'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Payer phone',
                  ),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text(
                    'Simulate payment (dev)',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  subtitle: const Text('Turn off for live MoMo/Airtel prompts'),
                  value: simulate,
                  activeThumbColor: ZanaColors.copper,
                  onChanged: (v) => setModal(() => simulate = v),
                ),
                if (pendingPurchaseId != null) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: ZanaColors.sand,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Text(
                      pendingInstructions ??
                          'Waiting for payment approval on your phone…',
                      style: const TextStyle(color: ZanaColors.ink),
                    ),
                  ),
                  const SizedBox(height: 10),
                  FilledButton(
                    onPressed: busy ? null : confirmPending,
                    child: Text(busy ? 'Checking…' : 'I’ve approved — check now'),
                  ),
                  const SizedBox(height: 12),
                ],
                ...packages.map((raw) {
                  final pkg = raw as Map<String, dynamic>;
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: ZanaColors.paper,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: ZanaColors.ink.withValues(alpha: 0.06),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${pkg['name']}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 16,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${pkg['credits']} credits · K${pkg['priceZmw']}',
                                style: const TextStyle(color: ZanaColors.muted),
                              ),
                            ],
                          ),
                        ),
                        FilledButton(
                          style: FilledButton.styleFrom(
                            backgroundColor: ZanaColors.copper,
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
                                      startPolling();
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
                      ],
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
  ).whenComplete(() => pollTimer?.cancel());
}

class _PayMethodChip extends StatelessWidget {
  const _PayMethodChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? ZanaColors.ink : ZanaColors.sand,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontWeight: FontWeight.w800,
              color: selected ? Colors.white : ZanaColors.ink,
            ),
          ),
        ),
      ),
    );
  }
}
