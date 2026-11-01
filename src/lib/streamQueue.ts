import type {
  OperatorLead,
  OperatorOrder,
  OperatorStreamPermission,
  StreamResponse,
} from "../types";

export const allStreamPermissions: OperatorStreamPermission[] = [
  "leads",
  "pending_orders",
  "quick_form_orders",
];
export const orderStreamType = (
  order: OperatorOrder,
): OperatorStreamPermission =>
  order.source === "lead_stream" ? "quick_form_orders" : "pending_orders";
export const leadStreamType = (lead: OperatorLead): OperatorStreamPermission =>
  lead.source === "web_form" ? "quick_form_orders" : "leads";

export function allowedStreamItems(stream?: StreamResponse) {
  const permissions = stream?.streamPermissions ?? allStreamPermissions;
  return {
    permissions,
    orders: (stream?.items ?? []).filter((order) =>
      permissions.includes(orderStreamType(order)),
    ),
    leads: (stream?.leads ?? []).filter((lead) =>
      permissions.includes(leadStreamType(lead)),
    ),
  };
}

export type StreamFilter =
  | "all"
  | "leads"
  | "orders"
  | "quick_form"
  | "express";
export type StreamEntry =
  | { kind: "lead"; item: OperatorLead }
  | { kind: "order"; item: OperatorOrder };

export function streamQueue(
  orders: OperatorOrder[],
  leads: OperatorLead[],
  filter: StreamFilter,
  search: string,
  newest: boolean,
): StreamEntry[] {
  const query = search.trim().toLocaleLowerCase();
  const entries: StreamEntry[] = [
    ...leads.map((item) => ({ kind: "lead" as const, item })),
    ...orders.map((item) => ({ kind: "order" as const, item })),
  ];
  return entries
    .filter((entry) => {
      const category =
        entry.kind === "lead"
          ? leadStreamType(entry.item)
          : orderStreamType(entry.item);
      if (filter === "leads" && category !== "leads") return false;
      if (filter === "orders" && category !== "pending_orders") return false;
      if (filter === "quick_form" && category !== "quick_form_orders")
        return false;
      if (
        filter === "express" &&
        (entry.kind !== "order" || entry.item.delivery?.type !== "express")
      )
        return false;
      const terms =
        entry.kind === "lead"
          ? [
              "lead",
              entry.item.streamNumericId,
              entry.item.product.nameUz,
              entry.item.product.nameRu,
            ]
          : [
              entry.item.orderNumber,
              entry.item.delivery?.regionNameUz,
              entry.item.delivery?.cityNameUz,
              ...entry.item.items.map((item) => item.name_uz),
            ];
      return terms
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase()
        .includes(query);
    })
    .sort(
      (a, b) =>
        (newest ? -1 : 1) *
        (Date.parse(a.item.createdAt) - Date.parse(b.item.createdAt)),
    );
}
