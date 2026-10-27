"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { operatorApi } from "../lib/api";
import { operatorKeys } from "../lib/queryKeys";
import { useAppSelector } from "../store/hooks";
import type { ProcessResponse, StreamResponse } from "../types";

export function useStreamOrders() {
  const token = useAppSelector((state) => state.auth.token);
  return useQuery({
    queryKey: operatorKeys.stream,
    queryFn: () => operatorApi.stream(),
    enabled: Boolean(token),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
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
      // Move the accepted order between queues immediately, then reconcile
      // with the server so the same order never offers a second acceptance.
      queryClient.setQueryData<StreamResponse>(
        operatorKeys.stream,
        (current) =>
          current
            ? {
                ...current,
                items: current.items.filter((item) => item._id !== order._id),
              }
            : current,
      );
      queryClient.setQueryData<ProcessResponse>(
        operatorKeys.process,
        (current) => ({
          items: [
            order,
            ...(current?.items ?? []).filter((item) => item._id !== order._id),
          ],
        }),
      );
      void queryClient.invalidateQueries({ queryKey: operatorKeys.stream });
      void queryClient.invalidateQueries({ queryKey: operatorKeys.process });
      void queryClient.invalidateQueries({
        queryKey: operatorKeys.order(order._id),
      });
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: operatorKeys.stream });
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
        deliveryType?: NonNullable<
          import("../types").OperatorOrder["delivery"]
        >["type"];
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
    mutationFn: ({ id, cancelReason }: { id: string; cancelReason?: string }) =>
      operatorApi.cancelOrder(id, cancelReason),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: operatorKeys.process });
      void queryClient.invalidateQueries({ queryKey: operatorKeys.stream });
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
