import { requestFCMToken } from "@/firebase";
import { api } from "@/lib/axios";

export async function registerForPushNotifications() {
  // 1. Ask for notification permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  // 2. Get FCM token
  const token = await requestFCMToken();
  if (!token) return;

  // 3. Send token to backend using the correct endpoint and payload
  try {
    await api.post("/api/device-token", {
      token,
      device_type: "web",      // or "browser" depending on backend enum
      platform: "web",         // platform = "web"
    });
    console.log("Device token saved successfully");
  } catch (error) {
    console.error("Failed to save device token", error);
  }
}