import webpush, { type PushSubscription } from "web-push";

let initialized = false;

function initWebPush() {
  if (initialized) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@rgbowl.in";

  if (!publicKey || !privateKey) {
    throw new Error("Missing VAPID keys for web push.");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  initialized = true;
}

export async function sendPush(
  subscription: PushSubscription,
  title: string,
  body: string,
) {
  initWebPush();
  return webpush.sendNotification(
    subscription,
    JSON.stringify({
      title,
      body,
    }),
  );
}
