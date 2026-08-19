"use client";

import { Clock3, Radio, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { OperatorSettings } from "../types";

function secondsAt(value?: string | null) {
  const [hours, minutes] = (value ?? "").split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return 0;
  return hours * 3_600 + minutes * 60;
}

function durationText(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function useStreamClock(settings: OperatorSettings | undefined, syncedAt: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  return useMemo(() => {
    if (!settings?.isStreamEnabled) {
      return { label: "Oqim o'chirilgan", value: "--:--:--" };
    }
    const day = 24 * 3_600;
    const elapsed = Math.max(0, Math.floor((now - syncedAt) / 1_000));
    const current = (secondsAt(settings.stream.currentTime) + elapsed) % day;
    const target = secondsAt(
      settings.stream.isOpen
        ? settings.streamEndTime
        : settings.streamStartTime,
    );
    const remaining = (target - current + day) % day;
    return {
      label: settings.stream.isOpen ? "Yopilishiga" : "Ochilishiga",
      value: durationText(remaining),
    };
  }, [now, settings, syncedAt]);
}

export function LiveStreamStatus({
  settings,
  count,
  syncedAt,
  fetching,
  compact = false,
  onRefresh,
}: {
  settings?: OperatorSettings;
  count: number;
  syncedAt: number;
  fetching: boolean;
  compact?: boolean;
  onRefresh: () => void;
}) {
  const clock = useStreamClock(settings, syncedAt);
  const isOpen = Boolean(settings?.stream.isOpen);

  return (
    <div
      className={`flex items-center gap-2 bg-slate-950 text-white ${
        compact ? "rounded-[16px] px-3 py-2.5" : "rounded-[18px] px-3.5 py-3"
      }`}
    >
      <span
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isOpen ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-slate-300"
        }`}
      >
        <Radio className="h-4 w-4" />
        {isOpen ? (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
        ) : null}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-extrabold">
            {isOpen ? "Buyurtmalar oqimi" : "Oqim yopiq"}
          </p>
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-slate-200">
            {count}
          </span>
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-slate-400">
          <Clock3 className="h-3 w-3" />
          {clock.label}
          <span className="font-mono font-bold tabular-nums text-white">
            {clock.value}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={fetching}
        aria-label="Oqimni yangilash"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
