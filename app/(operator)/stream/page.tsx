"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  Clock3,
  Headset,
  Loader2,
  MapPin,
  Package,
  Radio,
  Search,
  X,
  Zap,
} from "lucide-react";
import { LeadCard } from "@/src/components/LeadQueue";
import { ProductPortrait } from "@/src/components/OrderVisuals";
import { LiveStreamStatus } from "@/src/components/LiveStreamStatus";
import { EmptyState } from "@/src/components/ui";
import {
  useAcceptOrder,
  useProcessOrders,
  useStreamOrders,
} from "@/src/hooks/useOperatorOrders";
import { useLeadActions } from "@/src/hooks/useOperatorLeads";
import {
  deliveryPlace,
  errorText,
  formatPrice,
  orderAge,
} from "@/src/lib/format";
import {
  allowedStreamItems,
  leadStreamType,
  orderStreamType,
  streamQueue,
  type StreamFilter,
} from "@/src/lib/streamQueue";
import type { OperatorOrder } from "@/src/types";

function StreamOrderCard({
  order,
  disabled,
  accepting,
  onAccept,
}: {
  order: OperatorOrder;
  disabled: boolean;
  accepting: boolean;
  onAccept: () => void;
}) {
  const first = order.items[0];
  const express = order.delivery?.type === "express";
  return (
    <article className="work-card" aria-label={`Buyurtma ${order.orderNumber}`}>
      <header className="work-card-header">
        <span className={`work-kind ${express ? "work-kind--express" : ""}`}>
          {express ? <Zap size={13} /> : <Package size={13} />}
          {orderStreamType(order) === "quick_form_orders"
            ? "Tezkor forma"
            : express
              ? "Tezkor yetkazish"
              : "Buyurtma"}
        </span>
        <span className="work-reference">{order.orderNumber}</span>
        <span className="work-time">{orderAge(order)}</span>
      </header>
      <div className="work-product">
        <ProductPortrait
          src={first?.thumbnailUrl}
          name={first?.name_uz ?? "Buyurtma"}
          quantity={order.items.reduce((sum, item) => sum + item.quantity, 0)}
        />
        <div className="min-w-0">
          <h3 className="work-product-title">{first?.name_uz ?? "Buyurtma"}</h3>
          <p className="work-product-meta">
            {order.items.length > 1
              ? `Yana ${order.items.length - 1} tur mahsulot`
              : "1 tur mahsulot"}
          </p>
          <p className="work-price">{formatPrice(order.totalAmount)}</p>
        </div>
      </div>
      <p className="work-private">
        <MapPin size={13} />
        <span className="truncate">{deliveryPlace(order)}</span>
      </p>
      <footer className="work-card-footer">
        <span className="work-next">
          {order.paymentMethod === "payme"
            ? "Payme"
            : order.paymentMethod === "click"
              ? "Click"
              : "Yetkazishda to'lov"}
        </span>
        <button
          type="button"
          className="work-action work-action--primary"
          disabled={disabled}
          onClick={onAccept}
          aria-label={`${order.orderNumber} buyurtmani qabul qilish`}
        >
          {accepting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Headset size={15} />
          )}
          Qabul qilish
        </button>
      </footer>
    </article>
  );
}

export default function StreamPage() {
  const streamQuery = useStreamOrders();
  const processQuery = useProcessOrders();
  const acceptOrder = useAcceptOrder();
  const { accept: acceptLead } = useLeadActions();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StreamFilter>("all");
  const [newest, setNewest] = useState(false);
  const stream = streamQuery.data;
  const allowed = allowedStreamItems(stream);
  const ownedLeads = processQuery.data?.leads ?? [];
  const pending = (processQuery.data?.items ?? []).filter(
    (order) => order.status === "pending",
  );
  const ownedIds = new Set(pending.map((order) => order._id));
  const ownedLeadIds = new Set(ownedLeads.map((lead) => lead._id));
  const orders = allowed.orders.filter((order) => !ownedIds.has(order._id));
  const leads = allowed.leads.filter((lead) => !ownedLeadIds.has(lead._id));
  const isOpen = Boolean(stream?.settings.stream.isOpen);
  const busy = acceptOrder.isPending || acceptLead.isPending;
  const counts = {
    all: orders.length + leads.length,
    leads: leads.filter((lead) => leadStreamType(lead) === "leads").length,
    orders: orders.filter(
      (order) => orderStreamType(order) === "pending_orders",
    ).length,
    quick_form:
      leads.filter((lead) => leadStreamType(lead) === "quick_form_orders")
        .length +
      orders.filter((order) => orderStreamType(order) === "quick_form_orders")
        .length,
    express: orders.filter((order) => order.delivery?.type === "express")
      .length,
  };
  const filters: Array<{ key: StreamFilter; label: string }> = [
    { key: "all", label: "Barchasi" },
    ...(allowed.permissions.includes("leads")
      ? [{ key: "leads" as const, label: "Leadlar" }]
      : []),
    ...(allowed.permissions.includes("pending_orders")
      ? [{ key: "orders" as const, label: "Kutilayotgan" }]
      : []),
    ...(allowed.permissions.includes("quick_form_orders")
      ? [{ key: "quick_form" as const, label: "Tezkor forma" }]
      : []),
    ...(allowed.permissions.some((value) => value !== "leads")
      ? [{ key: "express" as const, label: "Tezkor yetkazish" }]
      : []),
  ];
  const activeFilter = filters.some((option) => option.key === filter)
    ? filter
    : "all";
  const visible = streamQueue(orders, leads, activeFilter, search, newest);
  const noAccess = Boolean(stream) && allowed.permissions.length === 0;
  const error = streamQuery.error || acceptOrder.error || acceptLead.error;

  return (
    <div className="queue-page">
      <header className="queue-heading">
        <div>
          <h1>Oqim</h1>
          <p>Lead yoki buyurtmani tanlang va ishni boshlang.</p>
        </div>
        <div className="queue-live">
          <LiveStreamStatus
            settings={stream?.settings}
            count={counts.all}
            syncedAt={streamQuery.dataUpdatedAt}
            fetching={streamQuery.isFetching}
            compact
            onRefresh={() => {
              void streamQuery.refetch();
              void processQuery.refetch();
            }}
          />
        </div>
      </header>
      <Link href="/process" className="queue-in-progress">
        <span className="queue-in-progress-icon">
          <Headset size={18} />
        </span>
        <span>
          <strong>Ish jarayonida</strong>
          <small>
            {pending.length} buyurtma, {ownedLeads.length} lead
          </small>
        </span>
        <span className="ml-auto flex items-center gap-2 text-xs font-semibold">
          Davom ettirish <ArrowUpRight size={17} />
        </span>
      </Link>
      {processQuery.error && (
        <p className="queue-error" role="alert">
          {errorText(processQuery.error, "Qabul qilinganlar yuklanmadi")}{" "}
          <button type="button" onClick={() => void processQuery.refetch()}>
            Qayta urinish
          </button>
        </p>
      )}
      <div className="queue-toolbar">
        <div className="queue-tabs" role="group" aria-label="Oqim turi">
          {filters.map(({ key, label }) => (
            <button
              type="button"
              key={key}
              aria-pressed={activeFilter === key}
              onClick={() => setFilter(key)}
            >
              {label}
              <span>{counts[key]}</span>
            </button>
          ))}
        </div>
        <div className="queue-search">
          <Search size={16} />
          <input
            aria-label="Oqimdan qidirish"
            placeholder="Mahsulot, raqam yoki hudud"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button
              type="button"
              aria-label="Qidiruvni tozalash"
              onClick={() => setSearch("")}
            >
              <X size={15} />
            </button>
          )}
        </div>
        <select
          className="queue-sort"
          aria-label="Oqimni saralash"
          value={newest ? "newest" : "oldest"}
          onChange={(event) => setNewest(event.target.value === "newest")}
        >
          <option value="oldest">Avval eskilari</option>
          <option value="newest">Avval yangilari</option>
        </select>
      </div>
      {error && (
        <p role="alert" className="queue-error">
          {errorText(error, "Oqim yuklanmadi")}{" "}
          <button type="button" onClick={() => void streamQuery.refetch()}>
            Yangilash
          </button>
        </p>
      )}
      {stream?.settings && !isOpen && (
        <div className="queue-closed">
          <Clock3 size={17} />
          <p>
            {stream.settings.isStreamEnabled
              ? `Oqim ${stream.settings.streamStartTime} da ochiladi.`
              : "Oqim vaqtincha o'chirilgan."}{" "}
            Qabul qilinganlar bilan ishlashni davom ettirishingiz mumkin.
          </p>
        </div>
      )}
      {streamQuery.isLoading ? (
        <div className="queue-loading" role="status">
          <Loader2 size={22} className="animate-spin" />
          Oqim yuklanmoqda
        </div>
      ) : (
        <>
          <section
            className="work-grid"
            aria-label="Qabul qilish uchun leadlar va buyurtmalar"
          >
            {visible.map((entry) =>
              entry.kind === "lead" ? (
                <LeadCard
                  key={`lead-${entry.item._id}`}
                  lead={entry.item}
                  disabled={busy || !isOpen}
                  accepting={
                    acceptLead.isPending &&
                    acceptLead.variables === entry.item._id
                  }
                  onAccept={() =>
                    acceptLead.mutate(entry.item._id, {
                      onSuccess: () => router.push(`/leads/${entry.item._id}`),
                    })
                  }
                />
              ) : (
                <StreamOrderCard
                  key={`order-${entry.item._id}`}
                  order={entry.item}
                  disabled={busy || !isOpen}
                  accepting={
                    acceptOrder.isPending &&
                    acceptOrder.variables === entry.item._id
                  }
                  onAccept={() =>
                    acceptOrder.mutate(entry.item._id, {
                      onSuccess: (order) =>
                        router.push(`/process/${order._id}`),
                    })
                  }
                />
              ),
            )}
          </section>
          {!visible.length && !streamQuery.error && (
            <EmptyState
              icon={search ? <Search size={22} /> : <Radio size={22} />}
              title={
                noAccess
                  ? "Oqim turlari ruxsat etilmagan"
                  : search
                    ? "Natija topilmadi"
                    : activeFilter === "leads"
                      ? "Yangi lead kutilmoqda"
                      : "Oqimda hozircha buyurtma yo'q"
              }
              description={
                noAccess
                  ? "Oqim ruxsatlarini sozlash uchun administratorga murojaat qiling. Qabul qilingan ishlar bilan Jarayon sahifasida davom etishingiz mumkin."
                  : search
                    ? "Boshqa mahsulot nomi yoki raqam bilan qidiring."
                    : "Yangi lead va buyurtmalar avtomatik ko'rinadi. Boshqa filtrni ham tekshirishingiz mumkin."
              }
            />
          )}
        </>
      )}
    </div>
  );
}
