"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Clock3,
  CheckCircle2,
  MapPin,
  PackageCheck,
} from "lucide-react";
import { CustomerCallButton } from "@/src/components/CustomerCallButton";
import { PageHeading } from "@/src/components/WorkspaceDesign";
import { EmptyState, GlassPanel } from "@/src/components/ui";
import { MarketerCommissionAudit } from "@/src/components/MarketerCommissionAudit";
import { OrderCard } from "@/src/components/OrderCard";
import {
  OrderEditor,
  deliveryLabel,
  type OrderFormValues,
} from "@/src/components/OrderEditor";
import {
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
  confirmed: "Tasdiqlangan",
  assigned: "Yetkazuvchiga berilgan",
  in_delivery: "Yetkazilmoqda",
  returning: "Qaytarilmoqda",
  returned: "Qaytarildi",
  delivered: "Yetkazilgan",
  cancelled: "Bekor qilingan",
};

const statusClass: Record<OperatorOrder["status"], string> = {
  pending: "border-blue-200 bg-blue-50 text-blue-800",
  confirmed: "border-cyan-200 bg-cyan-50 text-cyan-800",
  assigned: "border-sky-200 bg-sky-50 text-sky-800",
  in_delivery: "border-amber-200 bg-amber-50 text-amber-800",
  returning: "border-orange-200 bg-orange-50 text-orange-800",
  returned: "border-amber-200 bg-amber-50 text-amber-800",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-slate-50/70 px-2.5 py-2 mb-1.5 last:mb-0">
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
    <GlassPanel className="p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
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
  const [confirmedPopupOpen, setConfirmedPopupOpen] = useState(false);
  const order = orderQuery.data ?? null;
  const error =
    orderQuery.error ??
    updateOrder.error ??
    confirmOrder.error ??
    cancelOrder.error;
  const canEdit = order?.status === "pending";
  const canConfirm = order?.status === "pending";

  function saveOrder(id: string, values: OrderFormValues) {
    updateOrder.mutate({
      id,
      body: {
        deliveryType: values.deliveryType,
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
    <div className="space-y-3 pb-16 lg:pb-0">
      <PageHeading
        eyebrow="Buyurtma tafsilotlari"
        title={order.orderNumber}
        description="Mijoz, mahsulotlar va yetkazish ma'lumotlari."
      />
      <GlassPanel className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href="/process"
              aria-label="Jarayonga qaytish"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-base font-bold text-slate-950">
                {order.orderNumber}
              </p>
              <span
                className={`rounded-md px-2 py-1 text-[10px] font-semibold ${statusClass[order.status]}`}
              >
                {statusLabels[order.status]}
              </span>
            </div>
            <p className="mt-1 truncate text-xs font-semibold text-slate-500">
              {customerName(order)}
            </p>
            {order.customer.phoneNumber && (
              <CustomerCallButton
                phoneNumber={order.customer.phoneNumber}
                compact
                className="mt-2 hidden lg:inline-flex"
              />
            )}
          </div>
          <p className="shrink-0 text-right text-sm font-bold text-slate-950">
            {formatPrice(order.totalAmount)}
          </p>
        </div>
      </GlassPanel>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorText(error, "Buyurtma ma'lumotlari yuklanmadi")}
        </div>
      )}

      {updateOrder.isSuccess && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700"
        >
          <CheckCircle2 size={16} />
          O&apos;zgarishlar saqlandi.
        </div>
      )}
      {confirmedPopupOpen && !canEdit && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700"
        >
          <CheckCircle2 size={16} />
          Buyurtma muvaffaqiyatli tasdiqlandi.
        </div>
      )}
      <section className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="space-y-3">
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
                  value={deliveryLabel(order.delivery?.type ?? "normal")}
                />
                <InfoRow
                  label="Narx"
                  value={formatPrice(order.delivery?.price ?? 0)}
                />
                <InfoRow
                  label="Manzil"
                  value={
                    order.delivery?.address ?? order.deliveryAddress ?? "-"
                  }
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
            canConfirm={canConfirm}
            confirmedPopupOpen={confirmedPopupOpen}
            onCloseConfirmedPopup={() => setConfirmedPopupOpen(false)}
            saving={updateOrder.isPending}
            confirming={confirmOrder.isPending}
            cancelling={cancelOrder.isPending}
          />
        ) : (
          <GlassPanel className="p-4">
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
        <CustomerCallButton
          phoneNumber={order.customer.phoneNumber}
          className="fixed inset-x-3 bottom-[calc(4.65rem+var(--tg-safe-bottom))] z-[70] lg:hidden"
        />
      )}
    </div>
  );
}
