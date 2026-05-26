"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { operatorApi } from "../lib/api";
import { operatorKeys } from "../lib/queryKeys";
import { useAppSelector } from "../store/hooks";

export function useStreamOrders() {
  const token = useAppSelector((state) => state.auth.token);
  return useQuery({
    queryKey: operatorKeys.stream,
    queryFn: () => operatorApi.stream(),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
}

export function useProcessOrders() {
  const token = useAppSelector((state) => state.auth.token);
  return useQuery({
    queryKey: operatorKeys.process,
    queryFn: () => operatorApi.processOrders(),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
}

export function useOperatorOrder(id: string | null) {
  const token = useAppSelector((state) => state.auth.token);
  return useQuery({
    queryKey: id ? operatorKeys.order(id) : ["operator", "orders", "empty"],
    queryFn: () => operatorApi.orderDetails(id as string),
    enabled: Boolean(token && id),
    refetchInterval: 30_000,
  });
}

export function useOperatorRegions() {
  const token = useAppSelector((state) => state.auth.token);
  return useQuery({
    queryKey: operatorKeys.regions,
    queryFn: () => operatorApi.regions(),
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
  });
}

export function useOperatorCities(regionId?: string) {
  const token = useAppSelector((state) => state.auth.token);
  return useQuery({
    queryKey: operatorKeys.cities(regionId),
    queryFn: () => operatorApi.cities(regionId),
    enabled: Boolean(token && regionId),
    staleTime: 5 * 60_000,
  });
}

export function useAcceptOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => operatorApi.acceptOrder(id),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: operatorKeys.stream });
      void queryClient.invalidateQueries({ queryKey: operatorKeys.process });
      void queryClient.invalidateQueries({
        queryKey: operatorKeys.order(order._id),
      });
    },
  });
}

export function useUpdateOperatorOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: {
        regionId?: string;
        cityId?: string;
        address?: string;
        notes?: string;
        items?: Array<{ numericId: number; quantity: number }>;
      };
    }) => operatorApi.updateOrder(id, body),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: operatorKeys.process });
      void queryClient.invalidateQueries({ queryKey: operatorKeys.stream });
      void queryClient.invalidateQueries({
        queryKey: operatorKeys.order(order._id),
      });
    },
  });
}

export function useCancelOperatorOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      cancelReason,
    }: {
      id: string;
      cancelReason?: string;
    }) => operatorApi.cancelOrder(id, cancelReason),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: operatorKeys.process });
      void queryClient.invalidateQueries({ queryKey: operatorKeys.stream });
      void queryClient.invalidateQueries({
        queryKey: operatorKeys.order(order._id),
      });
    },
  });
}

export function useCallbackLaterOperatorOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      operatorApi.callbackLaterOrder(id, notes),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: operatorKeys.process });
      void queryClient.invalidateQueries({
        queryKey: operatorKeys.order(order._id),
      });
    },
  });
}

export function useConfirmOperatorOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      operatorApi.confirmOrder(id, notes),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: operatorKeys.process });
      void queryClient.invalidateQueries({
        queryKey: operatorKeys.order(order._id),
      });
    },
  });
}
