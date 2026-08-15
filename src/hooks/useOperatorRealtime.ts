"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { clearToken, SOCKET_URL } from "../lib/api";
import { operatorKeys } from "../lib/queryKeys";
import { clearSession } from "../store/authSlice";
import { useAppDispatch } from "../store/hooks";
import { useTelegram } from "../telegram/TelegramProvider";

export type OperatorRealtimeNotice = {
  id: number;
  message: string;
  tone: "success" | "warning";
};

type WalletUpdatePayload = {
  action?: string;
  amount?: number;
  reason?: string | null;
};

export function useOperatorRealtime(token: string | null) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const telegram = useTelegram();
  const [notice, setNotice] = useState<OperatorRealtimeNotice | null>(null);
  const noticeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!token) return;

    function clearOperatorSession() {
      clearToken();
      queryClient.clear();
      dispatch(clearSession());
      router.replace("/login");
    }

    const socket = io(`${SOCKET_URL}/operator/realtime`, {
      // Some Telegram in-app browsers and reverse proxies cannot complete a
      // websocket upgrade on the first attempt. Keep Socket.IO polling as the
      // standards-compliant fallback and upgrade when it becomes available.
      transports: ["websocket", "polling"],
      rememberUpgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 8_000,
      timeout: 12_000,
      auth: { token },
    });

    const refreshOperatorState = () => {
      void queryClient.invalidateQueries({ queryKey: operatorKeys.stream });
      void queryClient.invalidateQueries({ queryKey: operatorKeys.process });
      void queryClient.invalidateQueries({ queryKey: operatorKeys.wallet });
      void queryClient.invalidateQueries({
        queryKey: operatorKeys.withdrawals,
      });
      void queryClient.invalidateQueries({
        queryKey: operatorKeys.transactions,
      });
    };

    socket.on("connect", refreshOperatorState);

    socket.on("operator:stream-updated", () => {
      void queryClient.invalidateQueries({ queryKey: operatorKeys.stream });
    });
    socket.on("operator:process-updated", () => {
      void queryClient.invalidateQueries({ queryKey: operatorKeys.process });
    });
    socket.on("operator:wallet-updated", (payload: WalletUpdatePayload) => {
      void queryClient.invalidateQueries({ queryKey: operatorKeys.wallet });
      void queryClient.invalidateQueries({
        queryKey: operatorKeys.withdrawals,
      });
      void queryClient.invalidateQueries({
        queryKey: operatorKeys.transactions,
      });
      const messages: Record<string, string> = {
        withdrawal_requested: "Pul yechish so'rovi yuborildi",
        withdrawal_confirmed: "Pul yechish so'rovi to'landi",
        withdrawal_rejected: "Pul yechish so'rovi bekor qilindi",
        order_fee_credited: "Balansingizga operator bonusi qo'shildi",
        order_fee_reversed: "Operator bonusi balansdan qaytarildi",
        admin_prepayment: "Oldindan to'lov balansdan chiqarildi",
      };
      const message =
        messages[payload?.action ?? ""] ?? "Hamyon ma'lumoti yangilandi";
      const tone =
        payload?.action === "withdrawal_rejected" ||
        payload?.action === "order_fee_reversed"
          ? "warning"
          : "success";
      setNotice({ id: Date.now(), message, tone });
      telegram.haptic(tone);
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
      noticeTimer.current = window.setTimeout(() => setNotice(null), 4_500);
    });
    socket.on("operator:session-revoked", clearOperatorSession);
    socket.on("connect_error", (error) => {
      if (error.message === "Unauthorized") clearOperatorSession();
    });

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      refreshOperatorState();
      if (!socket.connected) socket.connect();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
      socket.disconnect();
    };
  }, [dispatch, queryClient, router, telegram, token]);

  return notice;
}
