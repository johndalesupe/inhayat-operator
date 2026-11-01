"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, Loader2, Receipt, Truck } from "lucide-react";
import { MarketerCommissionAudit } from "@/src/components/MarketerCommissionAudit";
import {
  CancelOrderButton,
  OrderCustomer,
  OrderEditor,
  OrderProducts,
} from "@/src/components/OrderEditor";
import { FormPanel } from "@/src/components/OrderFormParts";
import { useOperatorOrder } from "@/src/hooks/useOperatorOrders";
import { deliveryLabel } from "@/src/lib/delivery";
import { deliveryPlace, errorText, formatPrice } from "@/src/lib/format";
import type { OperatorOrder } from "@/src/types";

const labels: Record<OperatorOrder["status"], string> = {
  pending: "Tekshirilmoqda",
  confirmed: "Tasdiqlangan",
  assigned: "Yetkazuvchiga berilgan",
  in_delivery: "Yetkazilmoqda",
  returning: "Qaytarilmoqda",
  returned: "Qaytarildi",
  delivered: "Yetkazilgan",
  cancelled: "Bekor qilingan",
};

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const query = useOperatorOrder(id);
  const order = query.data;
  return (
    <div className="editing-workspace">
      <Link href="/process" className="form-back">
        <ArrowLeft size={17} />
        Jarayonga qaytish
      </Link>
      <header className="editing-heading">
        <h1>{order ? order.orderNumber : "Buyurtma tafsilotlari"}</h1>
        <p>Mijoz, mahsulotlar va yetkazish ma’lumotlari.</p>
        {order && (
          <span className={`form-status form-status--${order.status}`}>
            {labels[order.status]}
          </span>
        )}
      </header>
      {query.isLoading && (
        <div className="queue-loading" role="status">
          <Loader2 className="animate-spin" />
          Yuklanmoqda...
        </div>
      )}
      {query.error && (
        <p role="alert" className="form-error">
          {errorText(query.error, "Buyurtma yuklanmadi")}{" "}
          <button onClick={() => void query.refetch()}>Qayta urinish</button>
        </p>
      )}
      {order &&
        (order.status === "pending" ? (
          <OrderEditor key={order._id} order={order} />
        ) : (
          <div className="editing-columns">
            <div className="editing-stack">
              <OrderCustomer order={order} />
              <OrderProducts order={order} />
            </div>
            <div className="editing-stack">
              <FormPanel title="Yetkazib berish" icon={Truck}>
                <p className="form-summary">
                  <strong>{deliveryPlace(order)}</strong>
                  <br />
                  {order.delivery
                    ? deliveryLabel(order.delivery.type)
                    : "Belgilanmagan"}
                  <br />
                  {order.delivery?.address ||
                    order.deliveryAddress ||
                    "Qabul punktidan olish"}
                </p>
                <p className="form-hint">
                  Yetkazish: {formatPrice(order.delivery?.price ?? 0)} · alohida
                  to‘lanadi
                </p>
              </FormPanel>
              <FormPanel title="Hisob-kitob" icon={Receipt}>
                <dl className="form-totals">
                  <div>
                    <dt>Mahsulotlar</dt>
                    <dd>
                      {formatPrice(order.itemsAmount ?? order.totalAmount)}
                    </dd>
                  </div>
                  <div>
                    <dt>To‘langan</dt>
                    <dd>{formatPrice(order.payment?.orderPaidAmount ?? 0)}</dd>
                  </div>
                  <div className="form-total-final">
                    <dt>
                      {order.status === "cancelled"
                        ? "Buyurtma summasi"
                        : "Qoldiq"}
                    </dt>
                    <dd>
                      {formatPrice(
                        order.status === "cancelled"
                          ? order.totalAmount
                          : (order.payment?.remainingAmount ??
                              order.totalAmount),
                      )}
                    </dd>
                  </div>
                </dl>
                {order.status === "cancelled" && (
                  <p className="form-hint">
                    Buyurtma bekor qilingan. Faol buyurtmalar hisobidan
                    chiqarildi.
                  </p>
                )}
              </FormPanel>
              {order.notes && (
                <FormPanel title="Izoh" icon={FileText}>
                  <p className="form-summary">{order.notes}</p>
                </FormPanel>
              )}
              <CancelOrderButton order={order} />
            </div>
          </div>
        ))}
      {order?.marketerCommissionLogs?.length ? (
        <MarketerCommissionAudit logs={order.marketerCommissionLogs} />
      ) : null}
    </div>
  );
}
