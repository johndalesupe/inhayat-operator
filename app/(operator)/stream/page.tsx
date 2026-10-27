"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock3,
  Headset,
  Inbox,
  Loader2,
  MapPin,
  Package,
  Radio,
  Search,
  SlidersHorizontal,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { LiveStreamStatus } from "@/src/components/LiveStreamStatus";
import { CustomerCallButton } from "@/src/components/CustomerCallButton";
import {
  MetricCard,
  PageHeading,
  WorkflowGraphic,
} from "@/src/components/WorkspaceDesign";
import {
  BottomSheet,
  EmptyState,
  GlassPanel,
  PrimaryButton,
} from "@/src/components/ui";
import {
  useAcceptOrder,
  useProcessOrders,
  useStreamOrders,
} from "@/src/hooks/useOperatorOrders";
import {
  customerName,
  deliveryPlace,
  errorText,
  formatPrice,
  orderAge,
} from "@/src/lib/format";
import type { OperatorOrder } from "@/src/types";

function StreamOrderCard({
  order,
  busy,
  accepting,
  onAccept,
}: {
  order: OperatorOrder;
  busy: boolean;
  accepting: boolean;
  onAccept: () => void;
}) {
  const express = order.delivery?.type === "express";
  return (
    <GlassPanel className={`order-tile p-3.5 ${express ? "express" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${express ? "bg-amber-50 text-amber-600" : "bg-[#f1edff] text-blue-600"}`}
          >
            <Package size={17} strokeWidth={1.7} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-bold tracking-tight">
              {order.orderNumber}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
              <Clock3 size={10} />
              {orderAge(order)}
            </p>
          </div>
        </div>
        <span
          className={`soft-badge ${express ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
        >
          {express ? (
            <Zap size={10} />
          ) : (
            <span className="h-1 w-1 rounded-full bg-emerald-500" />
          )}
          {express ? "Tezkor" : "Yangi"}
        </span>
      </div>
      <div className="my-3 rounded-xl bg-[#f8f9fc] p-2">
        {order.items.slice(0, 2).map((item) => (
          <div key={item.numericId} className="flex items-center gap-2 py-1">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
              {item.thumbnailUrl ? (
                <Image
                  src={item.thumbnailUrl}
                  alt={item.name_uz}
                  fill
                  sizes="36px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <Package size={16} className="text-slate-300" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-[11px] font-semibold text-slate-700"
                title={item.name_uz}
              >
                {item.name_uz}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {formatPrice(item.price)}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              ×{item.quantity}
            </span>
          </div>
        ))}
        {order.items.length > 2 && (
          <p className="mt-1 text-[10px] text-slate-500">
            +{order.items.length - 2} ta mahsulot
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <MapPin size={12} className="text-slate-400" />
        <p className="truncate" title={deliveryPlace(order)}>
          {deliveryPlace(order)}
        </p>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[15px] font-bold tracking-[-.5px] tabular-nums">
            {formatPrice(order.totalAmount)}
          </p>
          <p className="mt-0.5 text-[9px] text-slate-400">
            {order.paymentMethod === "payme"
              ? "Payme"
              : order.paymentMethod === "click"
                ? "Click"
                : "Yetkazishda to'lov"}
            {order.paymentStatus === "paid" ? " · To'langan" : ""}
          </p>
        </div>
        <PrimaryButton
          type="button"
          disabled={busy}
          onClick={onAccept}
          aria-label={`${order.orderNumber} buyurtmani qabul qilish`}
          className="h-9 shrink-0 px-2.5 text-[11px]"
        >
          {accepting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Headset size={14} />
          )}
          Qabul qilish
        </PrimaryButton>
      </div>
    </GlassPanel>
  );
}

export default function StreamPage() {
  const streamQuery = useStreamOrders();
  const processQuery = useProcessOrders();
  const acceptOrder = useAcceptOrder();
  const [acceptedOrder, setAcceptedOrder] = useState<OperatorOrder | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "express">("all");
  const [sort, setSort] = useState<"oldest" | "newest">("oldest");
  const [expandedPending, setExpandedPending] = useState(false);
  const stream = streamQuery.data;
  const items = stream?.items ?? [];
  const pendingOrders = (processQuery.data?.items ?? [])
    .filter((order) => order.status === "pending")
    .sort(
      (a, b) =>
        Number(b.delivery?.type === "express") -
          Number(a.delivery?.type === "express") ||
        new Date(a.operatorAcceptedAt ?? a.createdAt).getTime() -
          new Date(b.operatorAcceptedAt ?? b.createdAt).getTime(),
    );
  const pendingIds = new Set(pendingOrders.map((order) => order._id));
  const availableOrders = items.filter((order) => !pendingIds.has(order._id));
  const query = search.trim().toLocaleLowerCase();
  const filtered = availableOrders
    .filter(
      (order) =>
        (filter === "all" || order.delivery?.type === "express") &&
        (!query ||
          [
            order.orderNumber,
            customerName(order),
            deliveryPlace(order),
            ...order.items.map((item) => item.name_uz),
          ]
            .join(" ")
            .toLocaleLowerCase()
            .includes(query)),
    )
    .sort(
      (a, b) =>
        (sort === "oldest" ? 1 : -1) *
        (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    );
  const isOpen = Boolean(stream?.settings.stream.isOpen);

  return (
    <div className="space-y-3.5">
      <PageHeading
        eyebrow="Jonli ish maydoni"
        title="Buyurtmalar oqimi"
        description="Qabul qiling. Mijoz bilan bog'laning. Tasdiqlang."
      />
      <section className="stream-banner">
        <div className="relative z-10 max-w-[380px]">
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-[#8573bf]">
            <Radio size={12} />
            HAMMASI BIR JOYDA
          </p>
          <h2 className="text-lg font-bold tracking-[-.5px] text-[#47357d]">
            Har bir buyurtma — yangi imkoniyat.
          </h2>
          <p className="mt-1.5 max-w-[300px] text-[11px] leading-5 text-[#8a7da9]">
            Yangi buyurtmalar va tasdiqlashni kutayotgan mijozlar doim ko&apos;z
            oldingizda.
          </p>
        </div>
        <WorkflowGraphic />
      </section>
      <div className="grid grid-cols-3 gap-2.5">
        <MetricCard
          icon={Inbox}
          label="Yangi buyurtmalar"
          value={streamQuery.isLoading ? "—" : availableOrders.length}
        />
        <MetricCard
          icon={Clock3}
          label="Tasdiq kutilmoqda"
          value={processQuery.isLoading ? "—" : pendingOrders.length}
          tone="amber"
        />
        <MetricCard
          icon={Wallet}
          label="Buyurtma uchun haq"
          value={
            <span className="text-sm sm:text-lg">
              {stream ? formatPrice(stream.settings.feePrice) : "—"}
            </span>
          }
          tone="mint"
        />
      </div>
      <LiveStreamStatus
        settings={stream?.settings}
        count={availableOrders.length}
        syncedAt={streamQuery.dataUpdatedAt}
        fetching={streamQuery.isFetching || processQuery.isFetching}
        onRefresh={() => {
          void streamQuery.refetch();
          void processQuery.refetch();
        }}
      />
      <div className="stream-layout">
        <section className="min-w-0 space-y-3" aria-label="Yangi buyurtmalar">
          <div className="flex items-center justify-between gap-2">
            <h2 className="section-title">
              Qabul qilish uchun{" "}
              <span className="ml-1.5 soft-badge">
                {availableOrders.length}
              </span>
            </h2>
            <label className="flex items-center gap-1 text-slate-400">
              <SlidersHorizontal size={12} />
              <select
                aria-label="Buyurtmalarni saralash"
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
                className="max-w-[135px] bg-transparent py-2 text-[10px] text-slate-500 outline-none"
              >
                <option value="oldest">Avval eskilari</option>
                <option value="newest">Avval yangilari</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-1.5">
            <div className="flex">
              <button
                type="button"
                className="filter-chip"
                aria-pressed={filter === "all"}
                onClick={() => setFilter("all")}
              >
                Barchasi
              </button>
              <button
                type="button"
                className="filter-chip"
                aria-pressed={filter === "express"}
                onClick={() => setFilter("express")}
              >
                <Zap size={12} />
                Tezkor
              </button>
            </div>
            <div className="relative min-w-[140px] flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-2 top-2.5 text-slate-400"
              />
              <input
                aria-label="Buyurtmalarni qidirish"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buyurtma, mahsulot, hudud..."
                className="h-9 w-full rounded-lg bg-[#f8f9fc] pl-7 pr-7 text-xs outline-none placeholder:text-slate-400"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Qidiruvni tozalash"
                  onClick={() => setSearch("")}
                  className="absolute right-0 top-0 flex h-9 w-8 items-center justify-center text-slate-500"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
          {streamQuery.error && (
            <div
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700"
            >
              {errorText(streamQuery.error, "Oqim yuklanmadi")}
              <button
                className="ml-2 font-semibold underline"
                onClick={() => void streamQuery.refetch()}
              >
                Qayta urinish
              </button>
            </div>
          )}
          {acceptOrder.error && (
            <div
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700"
            >
              {errorText(
                acceptOrder.error,
                "Buyurtma qabul qilinmadi. Qayta urinib ko'ring.",
              )}
            </div>
          )}
          {streamQuery.isLoading ? (
            <GlassPanel className="flex h-48 items-center justify-center">
              <Loader2
                className="animate-spin text-blue-700"
                aria-label="Buyurtmalar yuklanmoqda"
                size={24}
              />
            </GlassPanel>
          ) : filtered.length ? (
            <div className="grid gap-2.5 min-[1200px]:grid-cols-2">
              {filtered.map((order) => (
                <StreamOrderCard
                  key={order._id}
                  order={order}
                  busy={acceptOrder.isPending || !isOpen}
                  accepting={
                    acceptOrder.isPending && acceptOrder.variables === order._id
                  }
                  onAccept={() =>
                    acceptOrder.mutate(order._id, {
                      onSuccess: setAcceptedOrder,
                    })
                  }
                />
              ))}
            </div>
          ) : (
            !streamQuery.error && (
              <EmptyState
                icon={
                  query || filter !== "all" ? (
                    <Search size={21} />
                  ) : isOpen ? (
                    <Radio size={21} />
                  ) : (
                    <Clock3 size={21} />
                  )
                }
                title={
                  query || filter !== "all"
                    ? "Buyurtma topilmadi"
                    : isOpen
                      ? "Yangi buyurtma kutilmoqda"
                      : stream?.settings.isStreamEnabled === false
                        ? "Oqim vaqtincha o'chirilgan"
                        : "Oqim hozir yopiq"
                }
                description={
                  query || filter !== "all"
                    ? "Qidiruv so'zini o'zgartiring yoki boshqa filtrni tanlang."
                    : isOpen
                      ? "Yangi buyurtmalar avtomatik paydo bo'ladi. Shu vaqt ichida kutilayotgan buyurtmalarni yakunlang."
                      : stream?.settings.isStreamEnabled === false
                        ? "Qabul qilingan buyurtmalar bilan ishlashni davom ettirishingiz mumkin."
                        : `${stream?.settings.streamStartTime ?? "--:--"} da ochiladi. Qabul qilingan buyurtmalar bilan ishlashni davom ettirishingiz mumkin.`
                }
              />
            )
          )}
        </section>
        <aside
          className="pending-queue space-y-3"
          aria-label="Tasdiqlashni kutayotgan buyurtmalar"
        >
          <GlassPanel className="overflow-hidden p-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock3 size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="section-title">Tasdiq kutilmoqda</h2>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Siz qabul qilgan buyurtmalar
                </p>
              </div>
              <span className="soft-badge bg-amber-50 text-amber-700">
                {pendingOrders.length}
              </span>
            </div>
            {processQuery.error ? (
              <div
                role="alert"
                className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-700"
              >
                {errorText(
                  processQuery.error,
                  "Kutilayotgan buyurtmalar yuklanmadi",
                )}
                <button
                  type="button"
                  onClick={() => void processQuery.refetch()}
                  className="mt-2 block font-semibold underline"
                >
                  Qayta urinish
                </button>
              </div>
            ) : processQuery.isLoading ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2
                  size={20}
                  className="animate-spin text-blue-600"
                  aria-label="Kutilayotgan buyurtmalar yuklanmoqda"
                />
              </div>
            ) : pendingOrders.length ? (
              <>
                <div
                  className={`pending-list mt-3 ${expandedPending ? "pending-expanded" : ""}`}
                >
                  {(expandedPending
                    ? pendingOrders
                    : pendingOrders.slice(0, 3)
                  ).map((order) => (
                    <article
                      key={order._id}
                      className="rounded-xl bg-[#f8f7fc] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/process/${order._id}`}
                          className="text-xs font-bold hover:text-blue-700"
                        >
                          {order.orderNumber}
                        </Link>
                        <span className="flex items-center gap-1 text-[10px] text-amber-700">
                          {order.delivery?.type === "express" && (
                            <Zap size={10} />
                          )}
                          {orderAge(order)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {customerName(order)}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-bold tabular-nums">
                          {formatPrice(order.totalAmount)}
                        </p>
                        <Link
                          href={`/process/${order._id}`}
                          className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-blue-700"
                        >
                          Davom ettirish <ArrowRight size={13} />
                        </Link>
                      </div>
                      {order.customer.phoneNumber && (
                        <CustomerCallButton
                          phoneNumber={order.customer.phoneNumber}
                          compact
                          className="mt-1 w-full bg-white! text-emerald-700!"
                        />
                      )}
                    </article>
                  ))}
                </div>
                {pendingOrders.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setExpandedPending(!expandedPending)}
                    className="flex min-h-10 w-full items-center justify-center gap-1 text-[11px] font-semibold text-blue-700"
                  >
                    {expandedPending
                      ? "Kamroq ko'rsatish"
                      : `Barchasini ko'rsatish (${pendingOrders.length})`}
                  </button>
                )}
              </>
            ) : (
              <div className="py-6 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check size={18} />
                </span>
                <p className="mt-2 text-xs font-semibold">
                  Kutilayotgan buyurtma yo&apos;q
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  Qabul qilingan buyurtmalar shu yerda paydo bo&apos;ladi.
                </p>
              </div>
            )}
          </GlassPanel>
          <Link
            href="/process"
            className="flex items-center justify-between rounded-xl bg-[#eeebfa] px-3.5 py-3 text-[11px] font-semibold text-[#8275ae]"
          >
            Barcha buyurtmalar tarixi <ArrowUpRight size={15} />
          </Link>
          <div className="hidden px-1 pt-1 md:block">
            <p className="eyebrow mb-2">Ish tartibi</p>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Headset size={12} /> Qabul <ArrowRight size={10} />
              <span>Bog&apos;lanish</span>
              <ArrowRight size={10} />
              <CheckCircle2 size={12} /> Tasdiq
            </div>
          </div>
        </aside>
      </div>
      <BottomSheet
        open={Boolean(acceptedOrder)}
        onClose={() => setAcceptedOrder(null)}
        title="Buyurtma qabul qilindi"
        description={
          acceptedOrder
            ? `${acceptedOrder.orderNumber} tasdiqlash uchun tayyor.`
            : undefined
        }
      >
        <div className="rounded-2xl bg-emerald-50 p-4 text-center">
          <CheckCircle2 className="mx-auto text-emerald-600" size={32} />
          <p className="mt-2 text-sm font-semibold text-emerald-950">
            Mijoz bilan bog&apos;laning
          </p>
          <p className="mt-1 text-xs text-emerald-800">
            Manzil va mahsulotlarni tekshiring, so&apos;ng tasdiqlang.
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAcceptedOrder(null)}
            className="secondary-button flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold"
          >
            <Radio size={14} />
            Oqimda qolish
          </button>
          <Link
            href={acceptedOrder ? `/process/${acceptedOrder._id}` : "/process"}
            className="primary-button flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold"
          >
            Davom ettirish <ArrowRight size={14} />
          </Link>
        </div>
      </BottomSheet>
    </div>
  );
}
