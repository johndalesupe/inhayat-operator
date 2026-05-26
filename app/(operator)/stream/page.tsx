"use client";

import Link from "next/link";
import { CheckCircle2, Clock3, Headphones, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { EmptyState, GlassPanel, PrimaryButton } from "@/src/components/ui";
import { OrderCard } from "@/src/components/OrderCard";
import { errorText } from "@/src/lib/format";
import { useAcceptOrder, useStreamOrders } from "@/src/hooks/useOperatorOrders";
import type { OperatorOrder } from "@/src/types";

export default function StreamPage() {
  const streamQuery = useStreamOrders();
  const acceptOrder = useAcceptOrder();
  const [acceptedOrder, setAcceptedOrder] = useState<OperatorOrder | null>(
    null,
  );
  const stream = streamQuery.data;
  const items = stream?.items ?? [];

  return (
    <div className="space-y-4">
      <GlassPanel className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  stream?.settings.stream.isOpen
                    ? "bg-cyan-500"
                    : "bg-red-500"
                }`}
              />
              <h2 className="text-lg font-semibold text-neutral-950">
                Buyurtmalar oqimi
              </h2>
            </div>
            <p className="mt-1 text-sm font-medium text-neutral-500">
              {stream?.settings.stream.isOpen
                ? `${stream.settings.streamStartTime} - ${stream.settings.streamEndTime} oralig'ida ochiq`
                : "Oqim hozir yopiq yoki ish vaqtidan tashqarida"}
            </p>
          </div>
          <button
            onClick={() => streamQuery.refetch()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-900 transition hover:border-cyan-200 hover:bg-cyan-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                streamQuery.isFetching ? "animate-spin" : ""
              }`}
            />
            Yangilash
          </button>
        </div>
      </GlassPanel>

      {streamQuery.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorText(streamQuery.error, "Oqim yuklanmadi")}
        </div>
      )}

      {streamQuery.isLoading ? (
        <GlassPanel className="flex h-64 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
        </GlassPanel>
      ) : items.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              showContact={false}
              showDelivery={false}
              action={
                <PrimaryButton
                  className="w-full"
                  disabled={acceptOrder.isPending}
                  onClick={() =>
                    acceptOrder.mutate(order._id, {
                      onSuccess: (accepted) => setAcceptedOrder(accepted),
                    })
                  }
                >
                  {acceptOrder.isPending &&
                  acceptOrder.variables === order._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Headphones className="h-4 w-4" />
                  )}
                  Qabul qilish
                </PrimaryButton>
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Clock3 className="h-5 w-5" />}
          title="Hozircha yangi buyurtma yo'q"
          description="Oqim ochiq bo'lsa, yangi buyurtmalar shu yerda paydo bo'ladi."
        />
      )}

      {acceptedOrder && (
        <div className="fixed inset-0 z-50 flex items-end bg-neutral-950/45 p-0 sm:items-center sm:justify-center sm:p-4">
          <div className="w-full rounded-t-3xl border border-white/80 bg-white p-5 sm:max-w-md sm:rounded-2xl">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-neutral-950">
                  Buyurtma qabul qilindi
                </h3>
                <p className="mt-1 text-sm font-medium leading-6 text-neutral-500">
                  {acceptedOrder.orderNumber} jarayon sahifasiga qo&apos;shildi.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAcceptedOrder(null)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                Yopish
              </button>
              <Link
                href="/process"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-700 via-sky-600 to-cyan-500 px-4 text-sm font-semibold text-white transition hover:brightness-105"
              >
                Jarayonga o&apos;tish
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
