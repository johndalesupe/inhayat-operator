"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { clearToken, operatorApi, setToken } from "../lib/api";
import { operatorKeys } from "../lib/queryKeys";
import { clearSession, setOperator, setSession } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useTelegram } from "../telegram/TelegramProvider";

export function useOperatorProfile() {
  const token = useAppSelector((state) => state.auth.token);
  return useQuery({
    queryKey: operatorKeys.profile,
    queryFn: () => operatorApi.profile(),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useUpdateOperatorProfile() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fullName: string) => operatorApi.updateProfile({ fullName }),
    onSuccess: (profile) => {
      dispatch(setOperator(profile));
      queryClient.setQueryData(operatorKeys.profile, profile);
    },
  });
}

export function useUploadOperatorAvatar() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => operatorApi.uploadAvatar(file),
    onSuccess: (profile) => {
      dispatch(setOperator(profile));
      queryClient.setQueryData(operatorKeys.profile, profile);
    },
  });
}

export function useEnableOperatorNotifications() {
  const queryClient = useQueryClient();
  const { requestNotifications, haptic } = useTelegram();

  return useMutation({
    mutationFn: async () => {
      const allowed = await requestNotifications();
      if (!allowed) throw new Error("Telegram xabarlariga ruxsat berilmadi");
      return operatorApi.registerTelegramWriteAccess();
    },
    onSuccess: () => {
      haptic("success");
      void queryClient.invalidateQueries({ queryKey: operatorKeys.profile });
    },
    onError: () => haptic("warning"),
  });
}

export function useRequestOtp() {
  const { initData } = useTelegram();
  return useMutation({
    mutationFn: (phoneNumber: string) =>
      operatorApi.requestOtp(phoneNumber, initData),
  });
}

export function useVerifyOtp() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { initData, haptic, requestNotifications } = useTelegram();

  return useMutation({
    mutationFn: ({
      phoneNumber,
      code,
    }: {
      phoneNumber: string;
      code: string;
    }) => operatorApi.verifyOtp(phoneNumber, code, initData),
    onSuccess: async (data) => {
      setToken(data.accessToken);
      dispatch(
        setSession({ token: data.accessToken, operator: data.operator }),
      );
      haptic("success");
      const allowed = await requestNotifications();
      if (allowed) {
        await operatorApi.registerTelegramWriteAccess().catch(() => undefined);
      }
      router.replace("/stream");
    },
  });
}

export function useOperatorLogout() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();

  return () => {
    clearToken();
    dispatch(clearSession());
    queryClient.clear();
    router.replace("/login");
  };
}
