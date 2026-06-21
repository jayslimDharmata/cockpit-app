// netlify/functions/send-push.js
// This function sends native Web Push notifications using VAPID.
// It's called by Google Apps Script when the bar opens.

const webpush = require("web-push");

const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  "mailto:thecockpit@example.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

exports.handler = async (event) => {
  // CORS headers so Apps Script can call this
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method not allowed" };
  }

  try {
    const { subscriptions, title, body } = JSON.parse(event.body);

    if (!subscriptions || !Array.isArray(subscriptions)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "subscriptions must be an array" }),
      };
    }

    const payload = JSON.stringify({ title, body });

    const results = await Promise.allSettled(
      subscriptions.map((sub) => webpush.sendNotification(sub, payload))
    );

    const succeeded = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        sent: succeeded,
        failed: failed.length,
        errors: failed.map(f => f.reason?.message || String(f.reason)),
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

