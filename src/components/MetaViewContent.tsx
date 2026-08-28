"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
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
    if (!window.fbq) {
      return;
    }

    window.fbq("track", "ViewContent", {
      content_name: eventName,
      content_ids: [eventSlug],
      content_type: "product",
    });
  }, [eventName, eventSlug]);

  return null;
}