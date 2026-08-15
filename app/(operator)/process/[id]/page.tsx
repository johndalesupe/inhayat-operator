"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Clock3,
  MapPin,
  PackageCheck,
  PhoneCall,
} from "lucide-react";
import { EmptyState, GlassPanel } from "@/src/components/ui";
import { MarketerCommissionAudit } from "@/src/components/MarketerCommissionAudit";
import { OrderCard } from "@/src/components/OrderCard";
import { OrderEditor, type OrderFormValues } from "@/src/components/OrderEditor";
import {
  useCallbackLaterOperatorOrder,
  useCancelOperatorOrder,
  useConfirmOperatorOrder,
  useOperatorOrder,
  useUpdateOperatorOrder,
} from "@/src/hooks/useOperatorOrders";
import {
  customerName,
  deliveryPlace,
  errorText,
  formatPrice,
} from "@/src/lib/format";
import type { OperatorOrder } from "@/src/types";

const statusLabels: Record<OperatorOrder["status"], string> = {
  pending: "Tekshirilmoqda",
  callback_later: "Keyinroq qo'ng'iroq",
  confirmed: "Tasdiqlangan",
  assigned: "Yetkazuvchiga berilgan",
  in_delivery: "Yetkazilmoqda",
  delivered: "Yetkazilgan",
  cancelled: "Bekor qilingan",
};

const statusClass: Record<OperatorOrder["status"], string> = {
  pending: "border-blue-200 bg-blue-50 text-blue-800",
  callback_later: "border-amber-200 bg-amber-50 text-amber-800",
  confirmed: "border-cyan-200 bg-cyan-50 text-cyan-800",
  assigned: "border-sky-200 bg-sky-50 text-sky-800",
  in_delivery: "border-amber-200 bg-amber-50 text-amber-800",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-blue-50 py-3 last:border-0">
      <span className="text-sm font-bold text-neutral-500">{label}</span>
      <span className="text-right text-sm font-semibold text-neutral-950">
        {value}
      </span>
    </div>
  );
}

function DetailPanel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <GlassPanel className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
          {icon}
        </span>
        <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
      </div>
      {children}
    </GlassPanel>
  );
}

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const orderQuery = useOperatorOrder(params.id ?? null);
  const updateOrder = useUpdateOperatorOrder();
  const confirmOrder = useConfirmOperatorOrder();
  const cancelOrder = useCancelOperatorOrder();
  const callbackLaterOrder = useCallbackLaterOperatorOrder();
  const [confirmedPopupOpen, setConfirmedPopupOpen] = useState(false);
  const order = orderQuery.data ?? null;
  const error =
    orderQuery.error ??
    updateOrder.error ??
    confirmOrder.error ??
    cancelOrder.error ??
    callbackLaterOrder.error;
  const canEdit =
    order?.status === "pending" || order?.status === "callback_later";
  const canConfirm =
    order?.status === "pending" || order?.status === "callback_later";
  const canCallbackLater = order?.status === "pending";

  function saveOrder(id: string, values: OrderFormValues) {
    updateOrder.mutate({
      id,
      body: {
        regionId: values.regionId,
        cityId: values.cityId,
        address: values.address,
        notes: values.notes,
        items: values.items.map((item) => ({
          numericId: item.numericId,
          quantity: item.quantity,
        })),
      },
    });
  }

  function submitConfirm(id: string, notes?: string) {
    confirmOrder.mutate(
      { id, notes },
      { onSuccess: () => setConfirmedPopupOpen(true) },
    );
  }

  function submitCancel(id: string, cancelReason?: string) {
    cancelOrder.mutate({ id, cancelReason });
  }

  function submitCallbackLater(id: string, notes?: string) {
    callbackLaterOrder.mutate({ id, notes });
  }

  if (orderQuery.isLoading) {
    return (
      <GlassPanel className="flex h-64 items-center justify-center">
        <Clock3 className="h-7 w-7 animate-spin text-blue-700" />
      </GlassPanel>
    );
  }

  if (!order) {
    return (
      <EmptyState
        icon={<PackageCheck className="h-5 w-5" />}
        title="Buyurtma topilmadi"
        description="Bu buyurtma sizga biriktirilmagan yoki mavjud emas."
      />
    );
  }

  return (
    <div className="space-y-4">
      <GlassPanel className="bg-gradient-to-r from-white/85 via-blue-50/80 to-cyan-50/80 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/process"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Jarayonga qaytish
            </Link>
            <h1 className="mt-2 text-xl font-semibold text-neutral-950">
              {order.orderNumber}
            </h1>
            <p className="mt-1 text-sm font-medium text-neutral-500">
              {customerName(order)}
            </p>
            {order.customer.phoneNumber && (
              <a
                href={`tel:${order.customer.phoneNumber}`}
                className="mt-3 hidden h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-500 px-4 text-sm font-semibold text-white shadow-[0_0_24px_rgba(16,185,129,0.35)] transition hover:brightness-105 hover:shadow-[0_0_30px_rgba(16,185,129,0.45)] lg:inline-flex"
              >
                <PhoneCall className="h-4 w-4" />
                Qo&apos;ng&apos;iroq qilish
              </a>
            )}
          </div>
          <span
            className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusClass[order.status]}`}
          >
            {statusLabels[order.status]}
          </span>
        </div>
      </GlassPanel>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorText(error, "Buyurtma ma'lumotlari yuklanmadi")}
        </div>
      )}

      <section className="grid gap-4 xl:grid-cols-[1fr_440px]">
        <div className="space-y-4">
          <OrderCard
            order={order}
            showContact={false}
            showDelivery={false}
            showPayment
          />

          {!canEdit && (
            <div className="grid gap-4">
              <DetailPanel
                title="Yetkazish"
                icon={<MapPin className="h-4 w-4" />}
              >
                <InfoRow label="Hudud" value={deliveryPlace(order)} />
                <InfoRow
                  label="Turi"
                  value={
                    order.delivery?.type === "express" ? "Express" : "Oddiy"
                  }
                />
                <InfoRow
                  label="Narx"
                  value={formatPrice(order.delivery?.price ?? 0)}
                />
                <InfoRow
                  label="Manzil"
                  value={order.delivery?.address ?? order.deliveryAddress ?? "-"}
                />
              </DetailPanel>
            </div>
          )}

          {order.marketerCommissionLogs &&
            order.marketerCommissionLogs.length > 0 && (
              <MarketerCommissionAudit logs={order.marketerCommissionLogs} />
            )}
        </div>

        {canEdit ? (
          <OrderEditor
            key={order._id}
            order={order}
            onSave={saveOrder}
            onConfirm={submitConfirm}
            onCancel={submitCancel}
            onCallbackLater={submitCallbackLater}
            canConfirm={canConfirm}
            canCallbackLater={canCallbackLater}
            confirmedPopupOpen={confirmedPopupOpen}
            onCloseConfirmedPopup={() => setConfirmedPopupOpen(false)}
            saving={updateOrder.isPending}
            confirming={confirmOrder.isPending}
            cancelling={cancelOrder.isPending}
            callbacking={callbackLaterOrder.isPending}
          />
        ) : (
          <GlassPanel className="p-5">
            <h2 className="text-base font-semibold text-neutral-950">
              Buyurtma yopilgan
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-neutral-500">
              Bu statusdagi buyurtma operator tomonidan tahrirlanmaydi.
              Tafsilotlar chap tomonda ko&apos;rsatilgan.
            </p>
          </GlassPanel>
        )}
      </section>

      {order.customer.phoneNumber && (
        <a
          href={`tel:${order.customer.phoneNumber}`}
          className="fixed inset-x-4 bottom-24 z-40 flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-500 text-sm font-semibold text-white shadow-[0_0_26px_rgba(16,185,129,0.42)] transition hover:brightness-105 lg:hidden"
        >
          <PhoneCall className="h-4 w-4" />
          Qo&apos;ng&apos;iroq qilish
        </a>
      )}
    </div>
  );
}
