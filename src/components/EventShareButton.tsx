"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export default function EventShareButton({
  title,
  variant = "hero",
}: {
  title: string;
  variant?: "hero" | "light";
}) {
  const [copied, setCopied] = useState(false);

  async function shareEvent() {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `Confira ${title} na INGRESSE.`,
          url: window.location.href,
        });
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        setCopied(false);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={shareEvent}
      className={
        variant === "light"
          ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-[0.8125rem] font-bold text-[#302936] transition hover:bg-[#fff1ec] hover:text-[#f24423]"
          : "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 text-[0.8125rem] font-bold text-white backdrop-blur transition hover:bg-white/20"
      }
    >
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
      {copied ? "Link copiado" : "Compartilhar"}
    </button>
  );
}
