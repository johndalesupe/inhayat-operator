import type { OperatorLead, OperatorOrder } from "../types";

export type StreamFilter = "all" | "leads" | "orders" | "express";
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
      if (filter === "leads" && entry.kind !== "lead") return false;
      if (filter === "orders" && entry.kind !== "order") return false;
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
