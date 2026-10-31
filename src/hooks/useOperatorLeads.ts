"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { operatorApi } from "../lib/api";
import { operatorKeys } from "../lib/queryKeys";
import { useAppSelector } from "../store/hooks";
import type { ConvertOperatorLead, UpdateOperatorLead } from "../types";

export function useOperatorLead(id: string) {
  const token = useAppSelector((state) => state.auth.token);
  return useQuery({
    queryKey: ["operator", "leads", id],
    queryFn: () => operatorApi.leadDetails(id),
    enabled: Boolean(token && id),
    refetchInterval: 30_000,
  });
}

export function useLeadActions() {
  const client = useQueryClient();
  const refresh = () => {
    void client.invalidateQueries({ queryKey: operatorKeys.stream });
    void client.invalidateQueries({ queryKey: operatorKeys.process });
    void client.invalidateQueries({ queryKey: ["operator", "leads"] });
  };
  const accept = useMutation({
    mutationFn: operatorApi.acceptLead,
    onSettled: refresh,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateOperatorLead }) =>
      operatorApi.updateLead(id, body),
    onSettled: refresh,
  });
  const convert = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ConvertOperatorLead }) =>
      operatorApi.convertLead(id, body),
    onSettled: refresh,
  });
  return { accept, update, convert };
}
