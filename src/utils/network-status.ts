import { usePlaylistStore } from "@/stores/playlist-store";

export class NetworkStatus {
  static initialize() {
    if (typeof window !== "undefined") {
      const updateOnlineStatus = () => {
        usePlaylistStore.getState().setIsOnline(navigator.onLine);
      };

      window.addEventListener("online", updateOnlineStatus);
      window.addEventListener("offline", updateOnlineStatus);

      // Initial check
      updateOnlineStatus();
    }
  }
}
