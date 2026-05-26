"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { operatorApi } from "../lib/api";
import { operatorKeys } from "../lib/queryKeys";
import { useAppSelector } from "../store/hooks";
import type { CreateWithdrawalRequest } from "../types";

export function useOperatorWallet() {
  const token = useAppSelector((state) => state.auth.token);
  return useQuery({
    queryKey: operatorKeys.wallet,
    queryFn: () => operatorApi.wallet(),
    enabled: Boolean(token),
  });
}

export function useOperatorWithdrawals() {
  const token = useAppSelector((state) => state.auth.token);
  return useQuery({
    queryKey: operatorKeys.withdrawals,
    queryFn: () => operatorApi.withdrawals(),
    enabled: Boolean(token),
  });
}

export function useOperatorTransactions() {
  const token = useAppSelector((state) => state.auth.token);
  return useInfiniteQuery({
    queryKey: operatorKeys.transactions,
    queryFn: ({ pageParam }) => operatorApi.transactions(pageParam, 10),
    initialPageParam: 1,
    enabled: Boolean(token),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined,
  });
}

export function useCreateOperatorWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateWithdrawalRequest) =>
      operatorApi.createWithdrawal(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: operatorKeys.wallet });
      void queryClient.invalidateQueries({
        queryKey: operatorKeys.withdrawals,
      });
      void queryClient.invalidateQueries({
        queryKey: operatorKeys.transactions,
      });
    },
  });
}
