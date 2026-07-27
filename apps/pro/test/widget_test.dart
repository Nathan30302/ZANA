import 'package:flutter_test/flutter_test.dart';
import 'package:zana_pro/main.dart';

void main() {
  testWidgets('ZANA Pro app boots', (tester) async {
    await tester.pumpWidget(const ZanaProApp());
    expect(find.text('ZANA Pro'), findsOneWidget);
  });
}
