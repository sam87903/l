/** Browser-Benachrichtigungen (z.B. Timer-Ende), mit sauberem Fallback. */

export const notificationsSupported = () =>
  typeof window !== "undefined" && "Notification" in window;

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function notify(title, body) {
  if (!notificationsSupported() || Notification.permission !== "granted") return false;
  try {
    new Notification(title, { body, icon: "./icon.svg", badge: "./icon.svg" });
    return true;
  } catch {
    return false;
  }
}
