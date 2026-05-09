const axios = require('axios');

/**
 * Send Expo push notification (User.fcmToken stores Expo push token in MVP).
 * Fails silently in dev if token invalid — never blocks booking flow.
 */
async function sendExpoPush(toToken, title, body, data = {}) {
  if (!toToken || typeof toToken !== 'string' || !toToken.startsWith('ExponentPushToken')) {
    return { ok: false, skipped: true };
  }
  try {
    await axios.post(
      'https://exp.host/--/api/v2/push/send',
      {
        to: toToken,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
    );
    return { ok: true };
  } catch (e) {
    console.warn('Expo push failed:', e.message);
    return { ok: false };
  }
}

module.exports = { sendExpoPush };
