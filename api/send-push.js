Request
cat /tmp/cockpit-fix/api/send-push.js
Response
// api/send-push.js
// Vercel serverless function — sends native Web Push notifications using VAPID.

const webpush = require("web-push");

const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  "mailto:thecockpit@example.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  try {
    const { subscriptions, title, body } = req.body;

    if (!subscriptions || !Array.isArray(subscriptions)) {
      res.status(400).json({ error: "subscriptions must be an array" });
      return;
    }

    const payload = JSON.stringify({ title, body });
    const expiredEndpoints = [];

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub, payload);
          return { success: true, endpoint: sub.endpoint };
        } catch (err) {
          // 404 or 410 = subscription is no longer valid (device unsubscribed / browser cleared it)
          if (err.statusCode === 404 || err.statusCode === 410) {
            expiredEndpoints.push(sub.endpoint);
          }
          throw err;
        }
      })
    );

    const succeeded = results.filter(r => r.status === "fulfilled").length;
    const failed    = results.filter(r => r.status === "rejected");

    res.status(200).json({
      success: true,
      sent: succeeded,
      failed: failed.length,
      errors: failed.map(f => f.reason?.message || String(f.reason)),
      expiredEndpoints, // Apps Script can use this to clean stale tokens from the Sheet
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
