import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Make Pusher globally available (required by Echo for Reverb)
declare global {
  interface Window {
    Echo?: Echo<any>;
    Pusher?: typeof Pusher;
  }
}

// Set window.Pusher BEFORE creating Echo
window.Pusher = Pusher;

const echoInstance = new Echo({
  broadcaster: "reverb",
  key: import.meta.env.VITE_REVERB_APP_KEY as string,
  wsHost: import.meta.env.VITE_REVERB_HOST as string,
  wsPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
  wssPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME as string) === "https",
  enabledTransports: ["ws", "wss"],
  authEndpoint: `${import.meta.env.VITE_API_BASE_URL}/broadcasting/auth`,
  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
        Accept: "application/json", // ✅ Add this
    },
  },
});

export default echoInstance;