"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { clearToken, SOCKET_URL } from "../lib/api";
import { operatorKeys } from "../lib/queryKeys";
import { clearSession } from "../store/authSlice";
import { useAppDispatch } from "../store/hooks";

export function useOperatorRealtime(token: string | null) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    if (!token) return;

    function clearOperatorSession() {
      clearToken();
      queryClient.clear();
      dispatch(clearSession());
      router.replace("/login");
    }

    const socket = io(`${SOCKET_URL}/operator/realtime`, {
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("operator:stream-updated", () => {
      void queryClient.invalidateQueries({ queryKey: operatorKeys.stream });
    });
    socket.on("operator:process-updated", () => {
      void queryClient.invalidateQueries({ queryKey: operatorKeys.process });
    });
    socket.on("operator:session-revoked", clearOperatorSession);
    socket.on("connect_error", (error) => {
      if (error.message === "Unauthorized") clearOperatorSession();
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch, queryClient, router, token]);
}
