# ZANA (customer)

Flutter customer app.

```bash
# once Flutter SDK is on PATH:
export PATH="$HOME/development/flutter/bin:$PATH"
flutter create --platforms=ios,android .
flutter pub get
flutter run --dart-define=API_URL=http://localhost:3000/v1
```

On a physical device, point `API_URL` at your machine's LAN IP.
