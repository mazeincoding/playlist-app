"use client";

import HomeLayout from "@/layouts/home";
import { usePlaylistStore } from "@/stores/playlist-store";
import { AlertCircle } from "lucide-react";

export default function Home() {
  const isOnline = usePlaylistStore((state) => state.isOnline);

  return (
    <div className="h-dvh flex flex-col">
      {!isOnline && (
        <div className="bg-destructive text-foreground p-2 sm:p-3 text-center flex sm:flex-row items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm sm:text-base">You're offline!</p>
        </div>
      )}
      <div className="flex-grow overflow-y-hidden">
        <HomeLayout />
      </div>
    </div>
  );
}
