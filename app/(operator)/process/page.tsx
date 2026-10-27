"use client";

import { useMemo, useState } from "react";
import { Clock3, Loader2, PackageCheck, Search, Truck } from "lucide-react";
import { MetricCard, PageHeading } from "@/src/components/WorkspaceDesign";
import { EmptyState, GlassPanel } from "@/src/components/ui";
import { OrderCard } from "@/src/components/OrderCard";
import { errorText } from "@/src/lib/format";
import { useProcessOrders } from "@/src/hooks/useOperatorOrders";
import type { OperatorOrder } from "@/src/types";

const statusLabels: Record<OperatorOrder["status"], string> = {
  pending: "Tekshirilmoqda",
  confirmed: "Tasdiqlangan",
  assigned: "Yetkazuvchiga berilgan",
  in_delivery: "Yetkazilmoqda",
  returning: "Qaytarilmoqda",
  returned: "Qaytarildi",
  delivered: "Yetkazilgan",
  cancelled: "Bekor qilingan",
};

const statusClass: Record<OperatorOrder["status"], string> = {
  pending: "border-neutral-200 bg-white text-neutral-700",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  assigned: "border-violet-200 bg-violet-50 text-violet-800",
  in_delivery: "border-amber-200 bg-amber-50 text-amber-800",
  returning: "border-orange-200 bg-orange-50 text-orange-800",
  returned: "border-amber-200 bg-amber-50 text-amber-800",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function ProcessPage() {
  const processQuery = useProcessOrders();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OperatorOrder["status"] | "all">("all");
  const orders = useMemo(
    () => processQuery.data?.items ?? [],
    [processQuery.data?.items],
  );
  const counts = useMemo(() => {
    const result: Record<OperatorOrder["status"] | "all", number> = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      assigned: 0,
      in_delivery: 0,
      returning: 0,
      returned: 0,
      delivered: 0,
      cancelled: 0,
    };
    orders.forEach((order) => {
      result[order.status] += 1;
    });
    return result;
  }, [orders]);
  const filteredOrders = useMemo(() => {
    const base =
      status === "all"
        ? orders
        : orders.filter((order) => order.status === status);
    const query = search.trim().toLocaleLowerCase();
    return base
      .filter(
        (order) =>
          !query ||
          [
            order.orderNumber,
            order.customer.firstName,
            order.customer.lastName,
            order.customer.phoneNumber,
            ...order.items.map((item) => item.name_uz),
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase()
            .includes(query),
      )
      .map((order, index) => ({ order, index }))
      .sort((left, right) => {
        const leftExpress = left.order.delivery?.type === "express";
        const rightExpress = right.order.delivery?.type === "express";
        if (leftExpress !== rightExpress) return rightExpress ? 1 : -1;
        return left.index - right.index;
      })
      .map(({ order }) => order);
  }, [orders, status, search]);

  return (
    <div className="space-y-3.5">
      <PageHeading
        eyebrow="Buyurtmalar boshqaruvi"
        title="Mening buyurtmalarim"
        description="Har bir buyurtmaning holati va keyingi qadami."
      />
      <div className="grid grid-cols-3 gap-2.5">
        <MetricCard
          icon={Clock3}
          label="Kutilmoqda"
          value={counts.pending}
          tone="amber"
        />
        <MetricCard
          icon={Truck}
          label="Yetkazish jarayonida"
          value={counts.confirmed + counts.assigned + counts.in_delivery}
        />
        <MetricCard
          icon={PackageCheck}
          label="Yetkazilgan"
          value={counts.delivered}
          tone="mint"
        />
      </div>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
        <input
          aria-label="Mening buyurtmalarimdan qidirish"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buyurtma raqami, mijoz yoki telefon..."
          className="h-10 w-full rounded-xl bg-white pl-9 pr-3 text-xs outline-none"
        />
      </div>
      <div className="operator-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-white p-1.5">
        {(
          ["all", ...Object.keys(statusLabels)] as Array<
            OperatorOrder["status"] | "all"
          >
        ).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStatus(item)}
            aria-pressed={status === item}
            className="filter-chip shrink-0"
          >
            {item === "all" ? "Barchasi" : statusLabels[item]} ({counts[item]})
          </button>
        ))}
      </div>

      {processQuery.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorText(processQuery.error, "Buyurtmalar yuklanmadi")}
        </div>
      )}

      {processQuery.isLoading && (
        <GlassPanel className="flex h-48 items-center justify-center">
          <Loader2
            className="animate-spin text-blue-700"
            size={24}
            aria-label="Buyurtmalar yuklanmoqda"
          />
        </GlassPanel>
      )}
      <div className="grid gap-2.5 xl:grid-cols-2">
        {filteredOrders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            showDelivery={false}
            showItems={false}
            detailHref={`/process/${order._id}`}
            statusLabel={statusLabels[order.status]}
            statusClassName={statusClass[order.status]}
          />
        ))}
      </div>
      {!processQuery.isLoading &&
        !processQuery.error &&
        !filteredOrders.length && (
          <EmptyState
            icon={<PackageCheck className="h-5 w-5" />}
            title={
              orders.length
                ? "Buyurtma topilmadi"
                : "Hali buyurtma qabul qilinmagan"
            }
            description={
              orders.length
                ? "Qidiruv yoki status filtrini o'zgartirib ko'ring."
                : "Oqimdan qabul qilingan buyurtmalar shu yerda ko'rinadi."
            }
          />
        )}
    </div>
  );
}
