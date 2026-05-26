"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { clearToken, operatorApi, setToken } from "../lib/api";
import { operatorKeys } from "../lib/queryKeys";
import { clearSession, setOperator, setSession } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

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

export function useRequestOtp() {
  return useMutation({
    mutationFn: (phoneNumber: string) => operatorApi.requestOtp(phoneNumber),
  });
}

export function useVerifyOtp() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return useMutation({
    mutationFn: ({
      phoneNumber,
      code,
    }: {
      phoneNumber: string;
      code: string;
    }) => operatorApi.verifyOtp(phoneNumber, code),
    onSuccess: (data) => {
      setToken(data.accessToken);
      dispatch(setSession({ token: data.accessToken, operator: data.operator }));
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
