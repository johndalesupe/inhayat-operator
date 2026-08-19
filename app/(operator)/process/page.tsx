"use client";

import { useMemo, useState } from "react";
import { Loader2, PackageCheck } from "lucide-react";
import { EmptyState, GlassPanel } from "@/src/components/ui";
import { OrderCard } from "@/src/components/OrderCard";
import { errorText } from "@/src/lib/format";
import { useProcessOrders } from "@/src/hooks/useOperatorOrders";
import type { OperatorOrder } from "@/src/types";

const statusLabels: Record<OperatorOrder["status"], string> = {
  pending: "Tekshirilmoqda",
  callback_later: "Keyinroq qo'ng'iroq",
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
  callback_later: "border-amber-200 bg-amber-50 text-amber-800",
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
  const [status, setStatus] = useState<OperatorOrder["status"] | "all">("all");
  const orders = useMemo(
    () => processQuery.data?.items ?? [],
    [processQuery.data?.items],
  );
  const counts = useMemo(() => {
    const result: Record<OperatorOrder["status"] | "all", number> = {
      all: orders.length,
      pending: 0,
      callback_later: 0,
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
  const filteredOrders = useMemo(
    () => {
      const base =
        status === "all"
          ? orders
          : orders.filter((order) => order.status === status);
      return base
        .map((order, index) => ({ order, index }))
        .sort((left, right) => {
          const leftExpress = left.order.delivery?.type === "express";
          const rightExpress = right.order.delivery?.type === "express";
          if (leftExpress !== rightExpress) return rightExpress ? 1 : -1;
          return left.index - right.index;
        })
        .map(({ order }) => order);
    },
    [orders, status],
  );

  if (processQuery.isLoading) {
    return (
      <GlassPanel className="flex h-64 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
      </GlassPanel>
    );
  }

  if (!orders.length) {
    return (
      <div className="space-y-4">
        {processQuery.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorText(processQuery.error, "Buyurtmalar yuklanmadi")}
          </div>
        )}
        <EmptyState
          icon={<PackageCheck className="h-5 w-5" />}
          title={"Jarayonda buyurtma yo'q"}
          description={"Oqimdan qabul qilingan buyurtmalar statuslari bilan shu yerda ko'rinadi."}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(["all", ...Object.keys(statusLabels)] as Array<
          OperatorOrder["status"] | "all"
        >).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStatus(item)}
            className={`h-9 shrink-0 rounded-xl px-3 text-[11px] font-extrabold transition ${
              status === item
                ? "bg-blue-700 text-white"
                : "bg-white text-slate-600"
            }`}
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
      {!filteredOrders.length && (
        <EmptyState
          icon={<PackageCheck className="h-5 w-5" />}
          title="Bu statusda buyurtma yo'q"
          description="Boshqa status filtrini tanlab ko'ring."
        />
      )}
    </div>
  );
}
