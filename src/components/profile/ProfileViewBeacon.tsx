"use client";

import { useEffect } from "react";

interface ProfileViewBeaconProps {
  username: string;
}

// View telemetry has to happen in the browser: reading headers during render
// would make this page dynamic and defeat its ISR cache. The request is
// fire-and-forget and any failure is ignored.
export function ProfileViewBeacon({ username }: ProfileViewBeaconProps) {
  useEffect(() => {
    const key = `voucht-view:${username}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Private browsing / disabled storage: report anyway.
    }

    fetch("/api/profile-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
      keepalive: true,
    }).catch(() => {});
  }, [username]);

  return null;
}
