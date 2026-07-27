import 'package:flutter_test/flutter_test.dart';
import 'package:zana_customer/main.dart';

void main() {
  testWidgets('ZANA app boots', (tester) async {
    await tester.pumpWidget(const ZanaApp());
    expect(find.text('ZANA'), findsOneWidget);
  });
}
