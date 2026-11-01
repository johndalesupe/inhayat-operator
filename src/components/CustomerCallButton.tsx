"use client";

import { PhoneCall } from "lucide-react";
import { useTelegram } from "@/src/telegram/TelegramProvider";

function phoneHref(phoneNumber: string) {
  const value = phoneNumber.trim();
  const prefix = value.startsWith("+") ? "+" : "";
  return `tel:${prefix}${value.replace(/\D/g, "")}`;
}

export function CustomerCallButton({
  phoneNumber,
  compact = false,
  className = "",
}: {
  phoneNumber: string;
  compact?: boolean;
  className?: string;
}) {
  const { haptic } = useTelegram();
  const href = phoneHref(phoneNumber);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Mijozga qo'ng'iroq qilish: ${phoneNumber}`}
      onClick={() => {
        // Keep the trusted native link action. Telegram handles new-window
        // phone links externally; navigating this WebView can swallow the call.
        try {
          haptic("light");
        } catch {
          // Optional Telegram feedback must never prevent opening the dialer.
        }
      }}
      className={`call-button items-center justify-center gap-2 rounded-xl bg-emerald-600 font-extrabold text-white transition active:scale-[0.98] ${
        compact ? "h-10 px-3 text-xs" : "h-12 px-5 text-sm"
      } ${className}`}
    >
      <PhoneCall className="h-4 w-4" />
      Qo&apos;ng&apos;iroq qilish
    </a>
  );
}
