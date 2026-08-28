"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    __metaViewContentSent?: Record<string, boolean>;
  }
}

type MetaViewContentProps = {
  eventName: string;
  eventSlug: string;
};

export default function MetaViewContent({
  eventName,
  eventSlug,
}: MetaViewContentProps) {
  useEffect(() => {
    let attempts = 0;

    const sendViewContent = () => {
      if (!window.__metaViewContentSent) {
        window.__metaViewContentSent = {};
      }

      if (window.__metaViewContentSent[eventSlug]) {
        return true;
      }

      if (typeof window.fbq !== "function") {
        return false;
      }

      window.fbq("track", "ViewContent", {
        content_name: eventName,
        content_ids: [eventSlug],
        content_type: "product",
      });

      window.__metaViewContentSent[eventSlug] = true;

      return true;
    };

    if (sendViewContent()) {
      return;
    }

    const interval = window.setInterval(() => {
      attempts += 1;

      const sent = sendViewContent();

      if (sent || attempts >= 20) {
        window.clearInterval(interval);
      }
    }, 250);

    return () => {
      window.clearInterval(interval);
    };
  }, [eventName, eventSlug]);

  return null;
}