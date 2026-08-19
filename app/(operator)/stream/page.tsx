"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Clock3, Headphones, Loader2, MapPin, PackageCheck, Radio, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { LiveStreamStatus } from "@/src/components/LiveStreamStatus";
import { BottomSheet, EmptyState, GlassPanel, PrimaryButton } from "@/src/components/ui";
import { useAcceptOrder, useStreamOrders } from "@/src/hooks/useOperatorOrders";
import { customerName, deliveryPlace, errorText, formatPrice, orderAge } from "@/src/lib/format";
import type { OperatorOrder } from "@/src/types";

function paymentLabel(order: OperatorOrder) {
  if (order.paymentMethod === "payme") return "Payme";
  if (order.paymentMethod === "click") return "Click";
  return "Yetkazishda";
}

function StreamOrderCard({
  order,
  pending,
  onAccept,
}: {
  order: OperatorOrder;
  pending: boolean;
  onAccept: () => void;
}) {
  const isExpress = order.delivery?.type === "express";
  const previewItems = order.items.slice(0, 2);
  const extraItems = Math.max(order.items.length - previewItems.length, 0);

  return (
    <GlassPanel className={`overflow-hidden p-3 ${isExpress ? "border-amber-300" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-black text-slate-950">{order.orderNumber}</p>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{orderAge(order)}</span>
            {isExpress ? <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-extrabold text-amber-900">TEZKOR</span> : null}
          </div>
          <p className="mt-1 truncate text-xs font-semibold text-slate-500">{customerName(order)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-black text-slate-950">{formatPrice(order.totalAmount)}</p>
          <p className="mt-0.5 text-[10px] font-bold text-slate-400">{order.items.length} tur</p>
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5">
        {previewItems.map((item) => (
          <div key={item.numericId} className="grid grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-slate-50 p-1.5">
            <div className="relative h-[38px] w-[38px] overflow-hidden rounded-lg bg-white">
              {item.thumbnailUrl ? <Image src={item.thumbnailUrl} alt={item.name_uz} fill sizes="38px" unoptimized className="object-cover" /> : <ShoppingBag className="m-2.5 h-[18px] w-[18px] text-slate-300" />}
            </div>
            <div className="min-w-0"><p className="truncate text-[11px] font-extrabold text-slate-800">{item.name_uz}</p><p className="mt-0.5 text-[10px] font-semibold text-slate-400">#{item.numericId} · {formatPrice(item.price)}</p></div>
            <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-extrabold text-slate-700">{item.quantity} dona</span>
          </div>
        ))}
        {extraItems > 0 ? <p className="px-1 text-[10px] font-bold text-slate-400">+{extraItems} ta boshqa mahsulot</p> : null}
      </div>

      <div className="mt-2.5 flex items-center gap-2 border-t border-slate-100 pt-2.5">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-[10px] font-semibold text-slate-500"><MapPin className="h-3 w-3 shrink-0" />{deliveryPlace(order)}</p>
          <p className="mt-1 text-[10px] font-bold text-blue-700">{paymentLabel(order)} · {order.paymentStatus === "paid" ? "to'langan" : "kutilmoqda"}</p>
        </div>
        <PrimaryButton type="button" disabled={pending} onClick={onAccept} className="h-10 shrink-0 px-3 text-xs">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Headphones className="h-4 w-4" />}
          Qabul qilish
        </PrimaryButton>
      </div>
    </GlassPanel>
  );
}

export default function StreamPage() {
  const streamQuery = useStreamOrders();
  const acceptOrder = useAcceptOrder();
  const [acceptedOrder, setAcceptedOrder] = useState<OperatorOrder | null>(null);
  const stream = streamQuery.data;
  const items = stream?.items ?? [];

  return (
    <div className="space-y-2.5">
      <div className="hidden lg:block">
        <LiveStreamStatus settings={stream?.settings} count={items.length} syncedAt={streamQuery.dataUpdatedAt} fetching={streamQuery.isFetching} onRefresh={() => void streamQuery.refetch()} />
      </div>

      {streamQuery.error ? <div className="rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700">{errorText(streamQuery.error, "Oqim yuklanmadi")}</div> : null}

      {streamQuery.isLoading ? (
        <GlassPanel className="flex h-52 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-700" /></GlassPanel>
      ) : items.length ? (
        <div className="grid gap-2.5 xl:grid-cols-2">
          {items.map((order) => (
            <StreamOrderCard
              key={order._id}
              order={order}
              pending={acceptOrder.isPending && acceptOrder.variables === order._id}
              onAccept={() => acceptOrder.mutate(order._id, { onSuccess: setAcceptedOrder })}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon={stream?.settings.stream.isOpen ? <Radio className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />} title={stream?.settings.stream.isOpen ? "Yangi buyurtma kutilmoqda" : "Oqim hozir yopiq"} description={stream?.settings.stream.isOpen ? "Buyurtmalar real vaqt rejimida avtomatik paydo bo'ladi." : `${stream?.settings.streamStartTime ?? "--:--"} da yana ochiladi.`} />
      )}

      <BottomSheet open={Boolean(acceptedOrder)} onClose={() => setAcceptedOrder(null)} title="Buyurtma qabul qilindi" description={acceptedOrder ? `${acceptedOrder.orderNumber} jarayon ro'yxatiga o'tdi.` : undefined}>
        <div className="rounded-2xl bg-emerald-50 p-4 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white"><CheckCircle2 className="h-5 w-5" /></span>
          <p className="mt-3 text-sm font-extrabold text-emerald-950">Mijoz bilan bog&apos;lanishga tayyor</p>
          <p className="mt-1 text-xs font-medium text-emerald-800">Buyurtma tafsilotlarini tekshiring va tasdiqlang.</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setAcceptedOrder(null)} className="h-11 rounded-xl bg-slate-100 text-xs font-bold text-slate-700">Yopish</button>
          <Link href={acceptedOrder ? `/process/${acceptedOrder._id}` : "/process"} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 text-xs font-bold text-white"><PackageCheck className="h-4 w-4" />Tafsilotlar</Link>
        </div>
      </BottomSheet>
    </div>
  );
}
